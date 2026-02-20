package com.costsystem.modules.costcalc.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costcalc.dto.IndicatorValueDto;
import com.costsystem.modules.costcalc.entity.CalcRule;
import com.costsystem.modules.costcalc.entity.IndicatorValue;
import com.costsystem.modules.costcalc.repository.CalcRuleRepository;
import com.costsystem.modules.costcalc.repository.IndicatorValueRepository;
import com.costsystem.modules.costform.entity.FormVersion;
import com.costsystem.modules.costform.entity.LineItem;
import com.costsystem.modules.costform.repository.FormVersionRepository;
import com.costsystem.modules.costform.repository.LineItemRepository;
import com.costsystem.modules.costproject.repository.ProjectRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 指标计算服务
 * 严格遵循 cost-system-java 技能规则
 */
@Service
public class CalcService {

    private final CalcRuleRepository calcRuleRepository;
    private final IndicatorValueRepository indicatorValueRepository;
    private final FormVersionRepository formVersionRepository;
    private final LineItemRepository lineItemRepository;
    private final ProjectRepository projectRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CalcService(CalcRuleRepository calcRuleRepository,
                       IndicatorValueRepository indicatorValueRepository,
                       FormVersionRepository formVersionRepository,
                       LineItemRepository lineItemRepository,
                       ProjectRepository projectRepository) {
        this.calcRuleRepository = calcRuleRepository;
        this.indicatorValueRepository = indicatorValueRepository;
        this.formVersionRepository = formVersionRepository;
        this.lineItemRepository = lineItemRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional
    public List<IndicatorValueDto> recalculate(Long userId, Long versionId) {
        FormVersion version = loadVersionWithAccess(userId, versionId);
        ensureDraft(version);

        List<CalcRule> rules = calcRuleRepository
                .findByTemplateIdAndEnabledOrderByOrderNoAscIdAsc(version.getTemplateId(), true);
        if (rules.isEmpty()) {
            indicatorValueRepository.deleteByVersionIdAndIndicatorKeyNotIn(
                    versionId, Collections.singletonList("__EMPTY__"));
            return Collections.emptyList();
        }

        List<LineItem> lineItems = lineItemRepository.findByVersionId(versionId);
        Map<String, BigDecimal> indicatorMap = new HashMap<>();
        List<String> ruleKeys = new ArrayList<>();

        for (CalcRule rule : rules) {
            ruleKeys.add(rule.getIndicatorKey());
            EvalContext ctx = new EvalContext(lineItems, indicatorMap);
            EvalResult evalResult = ExpressionEvaluator.evaluate(rule.getExpression(), ctx);
            BigDecimal value = evalResult.getValue();
            indicatorMap.put(rule.getIndicatorKey(), value);

            IndicatorValue indicator = indicatorValueRepository
                    .findByVersionIdAndIndicatorKey(versionId, rule.getIndicatorKey())
                    .orElseGet(IndicatorValue::new);
            indicator.setVersionId(versionId);
            indicator.setIndicatorKey(rule.getIndicatorKey());
            indicator.setValue(value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP));
            indicator.setCalcTime(LocalDateTime.now());
            indicator.setTraceJson(buildTrace(rule, evalResult));
            indicatorValueRepository.save(indicator);
        }

        indicatorValueRepository.deleteByVersionIdAndIndicatorKeyNotIn(versionId, ruleKeys);
        return getIndicators(userId, versionId);
    }
    @Transactional(readOnly = true)
    public List<IndicatorValueDto> getIndicators(Long userId, Long versionId) {
        FormVersion version = loadVersionWithAccess(userId, versionId);
        List<CalcRule> rules = calcRuleRepository
                .findByTemplateIdAndEnabledOrderByOrderNoAscIdAsc(version.getTemplateId(), true);
        Map<String, CalcRule> ruleMap = new HashMap<>();
        for (CalcRule rule : rules) {
            ruleMap.put(rule.getIndicatorKey(), rule);
        }
        List<IndicatorValue> values = indicatorValueRepository.findByVersionIdOrderByIndicatorKeyAsc(versionId);
        List<IndicatorValueDto> result = new ArrayList<>();
        for (IndicatorValue value : values) {
            CalcRule rule = ruleMap.get(value.getIndicatorKey());
            String expression = rule != null ? rule.getExpression() : null;
            String name = value.getIndicatorKey();
            result.add(new IndicatorValueDto(value.getIndicatorKey(), name, value.getValue(),
                    value.getUnit(), expression, value.getCalcTime()));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getTrace(Long userId, Long versionId, String indicatorKey) {
        FormVersion version = loadVersionWithAccess(userId, versionId);
        IndicatorValue value = indicatorValueRepository.findByVersionIdAndIndicatorKey(version.getId(), indicatorKey)
                .orElseThrow(() -> BusinessException.notFound("指标不存在"));
        if (value.getTraceJson() == null || value.getTraceJson().isBlank()) {
            return Collections.emptyMap();
        }
        try {
            return objectMapper.readValue(value.getTraceJson(), Map.class);
        } catch (JsonProcessingException e) {
            return Collections.emptyMap();
        }
    }

    private String buildTrace(CalcRule rule, EvalResult evalResult) {
        Map<String, Object> trace = new LinkedHashMap<>();
        trace.put("rule_id", rule.getId());
        trace.put("expression", rule.getExpression());
        trace.put("result", evalResult.getValue());

        List<Map<String, Object>> intermediate = new ArrayList<>();
        Set<Long> matched = new LinkedHashSet<>();
        for (SumTrace sumTrace : evalResult.getSumTraces()) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("type", "SUM");
            item.put("expression", sumTrace.getExpression());
            item.put("field", sumTrace.getField());
            item.put("condition", sumTrace.getCondition());
            item.put("count", sumTrace.getCount());
            item.put("value", sumTrace.getValue());
            item.put("itemIds", sumTrace.getItemIds());
            intermediate.add(item);
            matched.addAll(sumTrace.getItemIds());
        }
        trace.put("intermediate", intermediate);
        trace.put("matched_line_item_ids", new ArrayList<>(matched));
        try {
            return objectMapper.writeValueAsString(trace);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private FormVersion loadVersionWithAccess(Long userId, Long versionId) {
        FormVersion version = formVersionRepository.findById(versionId)
                .orElseThrow(() -> BusinessException.notFound("版本不存在"));
        if (!projectRepository.hasAccess(version.getProjectId(), userId)) {
            throw BusinessException.unauthorized("无权限访问该版本");
        }
        return version;
    }

    private void ensureDraft(FormVersion version) {
        if (version.getStatus() != FormVersion.VersionStatus.DRAFT) {
            throw BusinessException.conflict("仅草稿状态允许重算");
        }
    }

    private static class EvalResult {
        private final BigDecimal value;
        private final List<SumTrace> sumTraces;

        private EvalResult(BigDecimal value, List<SumTrace> sumTraces) {
            this.value = value;
            this.sumTraces = sumTraces;
        }

        public BigDecimal getValue() {
            return value == null ? BigDecimal.ZERO : value;
        }

        public List<SumTrace> getSumTraces() {
            return sumTraces == null ? Collections.emptyList() : sumTraces;
        }
    }

    private static class SumTrace {
        private final String expression;
        private final String field;
        private final String condition;
        private final int count;
        private final BigDecimal value;
        private final List<Long> itemIds;

        private SumTrace(String expression, String field, String condition,
                         int count, BigDecimal value, List<Long> itemIds) {
            this.expression = expression;
            this.field = field;
            this.condition = condition;
            this.count = count;
            this.value = value;
            this.itemIds = itemIds;
        }

        public String getExpression() {
            return expression;
        }

        public String getField() {
            return field;
        }

        public String getCondition() {
            return condition;
        }

        public int getCount() {
            return count;
        }

        public BigDecimal getValue() {
            return value;
        }

        public List<Long> getItemIds() {
            return itemIds;
        }
    }

    private static class EvalContext {
        private final List<LineItem> lineItems;
        private final Map<String, BigDecimal> indicatorMap;
        private final ObjectMapper objectMapper;
        private final Map<LineItem, Map<String, Object>> extCache;
        private final List<SumTrace> sumTraces;
        private LineItem currentItem;

        private EvalContext(List<LineItem> lineItems, Map<String, BigDecimal> indicatorMap) {
            this.lineItems = lineItems == null ? Collections.emptyList() : lineItems;
            this.indicatorMap = indicatorMap == null ? new HashMap<>() : indicatorMap;
            this.objectMapper = new ObjectMapper();
            this.extCache = new IdentityHashMap<>();
            this.sumTraces = new ArrayList<>();
        }

        public List<LineItem> getLineItems() {
            return lineItems;
        }

        public List<SumTrace> getSumTraces() {
            return sumTraces;
        }

        public LineItem getCurrentItem() {
            return currentItem;
        }

        public void setCurrentItem(LineItem currentItem) {
            this.currentItem = currentItem;
        }

        public void addSumTrace(SumTrace trace) {
            if (trace != null) {
                sumTraces.add(trace);
            }
        }

        public Object resolveIdentifier(String name) {
            if (name == null) {
                return null;
            }
            String field = name;
            if (field.startsWith("line_item.")) {
                field = field.substring("line_item.".length());
            }
            if (currentItem != null) {
                Object fieldValue = resolveLineItemField(currentItem, field);
                if (fieldValue != null) {
                    return fieldValue;
                }
            }
            BigDecimal indicator = indicatorMap.get(name);
            if (indicator != null) {
                return indicator;
            }
            return BigDecimal.ZERO;
        }

        private Object resolveLineItemField(LineItem item, String field) {
            if (item == null || field == null) {
                return null;
            }
            String normalized = field.toLowerCase(Locale.ROOT);
            switch (normalized) {
                case "module_code":
                    return item.getModuleCode();
                case "category_code":
                    return item.getCategoryCode();
                case "item_code":
                    return item.getItemCode();
                case "name":
                    return item.getName();
                case "spec":
                    return item.getSpec();
                case "unit":
                    return item.getUnit();
                case "qty":
                    return item.getQty();
                case "price_tax":
                    return item.getPriceTax();
                case "amount_tax":
                    return item.getAmountTax();
                case "tax_rate":
                    return item.getTaxRate();
                case "remark":
                    return item.getRemark();
                case "sort_no":
                    return item.getSortNo();
                default:
                    break;
            }
            if (normalized.startsWith("ext.")) {
                return resolveExtValue(item, normalized.substring(4));
            }
            return null;
        }

        private Object resolveExtValue(LineItem item, String path) {
            if (item == null || path == null || path.isBlank()) {
                return null;
            }
            Map<String, Object> ext = extCache.computeIfAbsent(item, key -> parseExtJson(item.getExtJson()));
            if (ext == null || ext.isEmpty()) {
                return null;
            }
            String[] parts = path.split("\\.");
            Object current = ext;
            for (String part : parts) {
                if (!(current instanceof Map)) {
                    return null;
                }
                current = ((Map<?, ?>) current).get(part);
            }
            return current;
        }

        private Map<String, Object> parseExtJson(String extJson) {
            if (extJson == null || extJson.isBlank()) {
                return Collections.emptyMap();
            }
            try {
                return objectMapper.readValue(extJson, Map.class);
            } catch (Exception ex) {
                return Collections.emptyMap();
            }
        }
    }

    private static class EvalValue {
        private final Object value;

        private EvalValue(Object value) {
            this.value = value;
        }

        public boolean isString() {
            return value instanceof String;
        }

        public BigDecimal asNumber() {
            if (value == null) {
                return BigDecimal.ZERO;
            }
            if (value instanceof BigDecimal) {
                return (BigDecimal) value;
            }
            if (value instanceof Number) {
                return new BigDecimal(value.toString());
            }
            if (value instanceof Boolean) {
                return (Boolean) value ? BigDecimal.ONE : BigDecimal.ZERO;
            }
            if (value instanceof String) {
                try {
                    return new BigDecimal(((String) value).trim());
                } catch (Exception ex) {
                    return BigDecimal.ZERO;
                }
            }
            return BigDecimal.ZERO;
        }

        public String asString() {
            if (value == null) {
                return null;
            }
            if (value instanceof String) {
                return (String) value;
            }
            if (value instanceof BigDecimal) {
                return ((BigDecimal) value).stripTrailingZeros().toPlainString();
            }
            return String.valueOf(value);
        }

        public boolean asBoolean() {
            if (value == null) {
                return false;
            }
            if (value instanceof Boolean) {
                return (Boolean) value;
            }
            if (value instanceof Number) {
                return new BigDecimal(value.toString()).compareTo(BigDecimal.ZERO) != 0;
            }
            if (value instanceof String) {
                return !((String) value).trim().isEmpty();
            }
            return false;
        }
    }

    private interface Expr {
        EvalValue eval(EvalContext ctx);
    }

    private interface Condition {
        boolean test(EvalContext ctx);
    }

    private static class NumberExpr implements Expr {
        private final BigDecimal value;

        private NumberExpr(BigDecimal value) {
            this.value = value;
        }

        @Override
        public EvalValue eval(EvalContext ctx) {
            return new EvalValue(value);
        }

        @Override
        public String toString() {
            return value == null ? "0" : value.toPlainString();
        }
    }

    private static class StringExpr implements Expr {
        private final String value;

        private StringExpr(String value) {
            this.value = value;
        }

        @Override
        public EvalValue eval(EvalContext ctx) {
            return new EvalValue(value);
        }

        @Override
        public String toString() {
            return "'" + value + "'";
        }
    }

    private static class IdentifierExpr implements Expr {
        private final String name;

        private IdentifierExpr(String name) {
            this.name = name;
        }

        @Override
        public EvalValue eval(EvalContext ctx) {
            return new EvalValue(ctx.resolveIdentifier(name));
        }

        @Override
        public String toString() {
            return name;
        }
    }

    private static class UnaryExpr implements Expr {
        private final String op;
        private final Expr expr;

        private UnaryExpr(String op, Expr expr) {
            this.op = op;
            this.expr = expr;
        }

        @Override
        public EvalValue eval(EvalContext ctx) {
            BigDecimal value = expr.eval(ctx).asNumber();
            if ("-".equals(op)) {
                return new EvalValue(value.negate());
            }
            return new EvalValue(value);
        }

        @Override
        public String toString() {
            return op + expr;
        }
    }

    private static class BinaryExpr implements Expr {
        private final String op;
        private final Expr left;
        private final Expr right;

        private BinaryExpr(String op, Expr left, Expr right) {
            this.op = op;
            this.left = left;
            this.right = right;
        }

        @Override
        public EvalValue eval(EvalContext ctx) {
            BigDecimal leftValue = left.eval(ctx).asNumber();
            BigDecimal rightValue = right.eval(ctx).asNumber();
            switch (op) {
                case "+":
                    return new EvalValue(leftValue.add(rightValue));
                case "-":
                    return new EvalValue(leftValue.subtract(rightValue));
                case "*":
                    return new EvalValue(leftValue.multiply(rightValue));
                case "/":
                    if (rightValue.compareTo(BigDecimal.ZERO) == 0) {
                        return new EvalValue(BigDecimal.ZERO);
                    }
                    return new EvalValue(leftValue.divide(rightValue, 10, RoundingMode.HALF_UP));
                default:
                    return new EvalValue(BigDecimal.ZERO);
            }
        }

        @Override
        public String toString() {
            return "(" + left + " " + op + " " + right + ")";
        }
    }

    private static class SumExpr implements Expr {
        private final Expr expr;
        private final Condition condition;

        private SumExpr(Expr expr, Condition condition) {
            this.expr = expr;
            this.condition = condition;
        }

        @Override
        public EvalValue eval(EvalContext ctx) {
            BigDecimal sum = BigDecimal.ZERO;
            List<Long> ids = new ArrayList<>();
            int count = 0;
            for (LineItem item : ctx.getLineItems()) {
                ctx.setCurrentItem(item);
                if (condition == null || condition.test(ctx)) {
                    BigDecimal value = expr.eval(ctx).asNumber();
                    sum = sum.add(value);
                    count++;
                    if (item.getId() != null) {
                        ids.add(item.getId());
                    }
                }
            }
            ctx.setCurrentItem(null);

            String fieldText = expr.toString();
            String conditionText = condition == null ? null : condition.toString();
            String expressionText = "SUM(" + fieldText + (conditionText == null ? "" : " WHERE " + conditionText) + ")";
            ctx.addSumTrace(new SumTrace(expressionText, fieldText, conditionText, count, sum, ids));
            return new EvalValue(sum);
        }

        @Override
        public String toString() {
            return "SUM(" + expr + (condition == null ? "" : " WHERE " + condition) + ")";
        }
    }

    private static class RoundExpr implements Expr {
        private final Expr expr;
        private final Expr scale;

        private RoundExpr(Expr expr, Expr scale) {
            this.expr = expr;
            this.scale = scale;
        }

        @Override
        public EvalValue eval(EvalContext ctx) {
            BigDecimal value = expr.eval(ctx).asNumber();
            int scaleValue = scale.eval(ctx).asNumber().intValue();
            return new EvalValue(value.setScale(scaleValue, RoundingMode.HALF_UP));
        }

        @Override
        public String toString() {
            return "ROUND(" + expr + ", " + scale + ")";
        }
    }

    private static class IfExpr implements Expr {
        private final Condition condition;
        private final Expr trueExpr;
        private final Expr falseExpr;

        private IfExpr(Condition condition, Expr trueExpr, Expr falseExpr) {
            this.condition = condition;
            this.trueExpr = trueExpr;
            this.falseExpr = falseExpr;
        }

        @Override
        public EvalValue eval(EvalContext ctx) {
            if (condition == null) {
                return falseExpr.eval(ctx);
            }
            if (condition.test(ctx)) {
                return trueExpr.eval(ctx);
            }
            return falseExpr.eval(ctx);
        }

        @Override
        public String toString() {
            return "IF(" + condition + ", " + trueExpr + ", " + falseExpr + ")";
        }
    }

    private static class CompareCondition implements Condition {
        private final Expr left;
        private final Expr right;
        private final String op;

        private CompareCondition(Expr left, Expr right, String op) {
            this.left = left;
            this.right = right;
            this.op = op;
        }

        @Override
        public boolean test(EvalContext ctx) {
            EvalValue leftValue = left.eval(ctx);
            EvalValue rightValue = right.eval(ctx);
            switch (op) {
                case "=":
                case "==":
                    return equalsValue(leftValue, rightValue);
                case "!=":
                    return !equalsValue(leftValue, rightValue);
                case ">":
                    return compareNumber(leftValue, rightValue) > 0;
                case ">=":
                    return compareNumber(leftValue, rightValue) >= 0;
                case "<":
                    return compareNumber(leftValue, rightValue) < 0;
                case "<=":
                    return compareNumber(leftValue, rightValue) <= 0;
                default:
                    return false;
            }
        }

        private boolean equalsValue(EvalValue leftValue, EvalValue rightValue) {
            if (leftValue.isString() || rightValue.isString()) {
                String lv = leftValue.asString();
                String rv = rightValue.asString();
                if (lv == null || rv == null) {
                    return false;
                }
                return lv.equals(rv);
            }
            return leftValue.asNumber().compareTo(rightValue.asNumber()) == 0;
        }

        private int compareNumber(EvalValue leftValue, EvalValue rightValue) {
            return leftValue.asNumber().compareTo(rightValue.asNumber());
        }

        @Override
        public String toString() {
            return left + " " + op + " " + right;
        }
    }

    private static class InCondition implements Condition {
        private final Expr left;
        private final List<Expr> options;

        private InCondition(Expr left, List<Expr> options) {
            this.left = left;
            this.options = options == null ? Collections.emptyList() : options;
        }

        @Override
        public boolean test(EvalContext ctx) {
            EvalValue leftValue = left.eval(ctx);
            for (Expr option : options) {
                EvalValue rightValue = option.eval(ctx);
                if (leftValue.isString() || rightValue.isString()) {
                    String lv = leftValue.asString();
                    String rv = rightValue.asString();
                    if (lv != null && lv.equals(rv)) {
                        return true;
                    }
                } else if (leftValue.asNumber().compareTo(rightValue.asNumber()) == 0) {
                    return true;
                }
            }
            return false;
        }

        @Override
        public String toString() {
            StringBuilder builder = new StringBuilder();
            builder.append(left).append(" IN (");
            for (int i = 0; i < options.size(); i++) {
                if (i > 0) {
                    builder.append(", ");
                }
                builder.append(options.get(i));
            }
            builder.append(")");
            return builder.toString();
        }
    }

    private static class LogicalCondition implements Condition {
        private final String op;
        private final Condition left;
        private final Condition right;

        private LogicalCondition(String op, Condition left, Condition right) {
            this.op = op;
            this.left = left;
            this.right = right;
        }

        @Override
        public boolean test(EvalContext ctx) {
            if ("AND".equals(op)) {
                return left.test(ctx) && right.test(ctx);
            }
            return left.test(ctx) || right.test(ctx);
        }

        @Override
        public String toString() {
            return "(" + left + " " + op + " " + right + ")";
        }
    }

    private static class TruthyCondition implements Condition {
        private final Expr expr;

        private TruthyCondition(Expr expr) {
            this.expr = expr;
        }

        @Override
        public boolean test(EvalContext ctx) {
            return expr.eval(ctx).asBoolean();
        }

        @Override
        public String toString() {
            return expr.toString();
        }
    }

    private static class ExpressionEvaluator {
        private ExpressionEvaluator() {}

        public static EvalResult evaluate(String expression, EvalContext ctx) {
            if (expression == null || expression.isBlank()) {
                return new EvalResult(BigDecimal.ZERO, Collections.emptyList());
            }
            try {
                Parser parser = new Parser(expression);
                Expr expr = parser.parseExpression();
                parser.expectEnd();
                BigDecimal value = expr.eval(ctx).asNumber();
                return new EvalResult(value, ctx.getSumTraces());
            } catch (RuntimeException ex) {
                throw BusinessException.conflict("规则表达式解析失败: " + ex.getMessage());
            }
        }
    }

    private enum TokenType {
        IDENT, NUMBER, STRING, OP, COMMA, LPAREN, RPAREN, EOF
    }

    private static class Token {
        private final TokenType type;
        private final String text;

        private Token(TokenType type, String text) {
            this.type = type;
            this.text = text;
        }
    }

    private static class Tokenizer {
        private final String input;
        private final int length;
        private int index;

        private Tokenizer(String input) {
            this.input = input == null ? "" : input;
            this.length = this.input.length();
        }

        public List<Token> tokenize() {
            List<Token> tokens = new ArrayList<>();
            while (index < length) {
                char ch = input.charAt(index);
                if (Character.isWhitespace(ch)) {
                    index++;
                    continue;
                }
                if (isIdentifierStart(ch)) {
                    tokens.add(readIdentifier());
                    continue;
                }
                if (Character.isDigit(ch)) {
                    tokens.add(readNumber());
                    continue;
                }
                if (ch == '\'' || ch == '"') {
                    tokens.add(readString(ch));
                    continue;
                }
                if (ch == '(') {
                    tokens.add(new Token(TokenType.LPAREN, "("));
                    index++;
                    continue;
                }
                if (ch == ')') {
                    tokens.add(new Token(TokenType.RPAREN, ")"));
                    index++;
                    continue;
                }
                if (ch == ',') {
                    tokens.add(new Token(TokenType.COMMA, ","));
                    index++;
                    continue;
                }
                String op = readOperator();
                if (op != null) {
                    tokens.add(new Token(TokenType.OP, op));
                    continue;
                }
                index++;
            }
            tokens.add(new Token(TokenType.EOF, ""));
            return tokens;
        }

        private boolean isIdentifierStart(char ch) {
            return Character.isLetter(ch) || ch == '_' || ch == '.';
        }

        private boolean isIdentifierPart(char ch) {
            return Character.isLetterOrDigit(ch) || ch == '_' || ch == '.';
        }

        private Token readIdentifier() {
            int start = index;
            index++;
            while (index < length && isIdentifierPart(input.charAt(index))) {
                index++;
            }
            return new Token(TokenType.IDENT, input.substring(start, index));
        }

        private Token readNumber() {
            int start = index;
            index++;
            boolean hasDot = false;
            while (index < length) {
                char ch = input.charAt(index);
                if (Character.isDigit(ch)) {
                    index++;
                    continue;
                }
                if (ch == '.' && !hasDot) {
                    hasDot = true;
                    index++;
                    continue;
                }
                break;
            }
            return new Token(TokenType.NUMBER, input.substring(start, index));
        }

        private Token readString(char quote) {
            index++;
            StringBuilder builder = new StringBuilder();
            while (index < length) {
                char ch = input.charAt(index);
                if (ch == '\\' && index + 1 < length) {
                    builder.append(input.charAt(index + 1));
                    index += 2;
                    continue;
                }
                if (ch == quote) {
                    index++;
                    break;
                }
                builder.append(ch);
                index++;
            }
            return new Token(TokenType.STRING, builder.toString());
        }

        private String readOperator() {
            if (index >= length) {
                return null;
            }
            char ch = input.charAt(index);
            if (ch == '>' || ch == '<' || ch == '!') {
                if (index + 1 < length && input.charAt(index + 1) == '=') {
                    index += 2;
                    return "" + ch + "=";
                }
                index++;
                return String.valueOf(ch);
            }
            if (ch == '=' || ch == '+' || ch == '-' || ch == '*' || ch == '/') {
                index++;
                return String.valueOf(ch);
            }
            return null;
        }
    }

    private static class Parser {
        private final List<Token> tokens;
        private int pos;

        private Parser(String expression) {
            this.tokens = new Tokenizer(expression).tokenize();
        }

        private Token peek() {
            return tokens.get(pos);
        }

        private Token advance() {
            return tokens.get(pos++);
        }

        private boolean match(TokenType type) {
            if (peek().type == type) {
                pos++;
                return true;
            }
            return false;
        }

        private boolean matchOp(String op) {
            if (peek().type == TokenType.OP && peek().text.equals(op)) {
                pos++;
                return true;
            }
            return false;
        }

        private boolean matchKeyword(String keyword) {
            if (peek().type == TokenType.IDENT && keyword.equalsIgnoreCase(peek().text)) {
                pos++;
                return true;
            }
            return false;
        }

        private Token expect(TokenType type, String message) {
            if (peek().type != type) {
                throw new IllegalArgumentException(message);
            }
            return advance();
        }

        public void expectEnd() {
            if (peek().type != TokenType.EOF) {
                throw new IllegalArgumentException("无法解析表达式");
            }
        }

        public Expr parseExpression() {
            return parseAdditive();
        }

        private Expr parseAdditive() {
            Expr expr = parseMultiplicative();
            while (true) {
                if (matchOp("+")) {
                    expr = new BinaryExpr("+", expr, parseMultiplicative());
                    continue;
                }
                if (matchOp("-")) {
                    expr = new BinaryExpr("-", expr, parseMultiplicative());
                    continue;
                }
                break;
            }
            return expr;
        }

        private Expr parseMultiplicative() {
            Expr expr = parseUnary();
            while (true) {
                if (matchOp("*")) {
                    expr = new BinaryExpr("*", expr, parseUnary());
                    continue;
                }
                if (matchOp("/")) {
                    expr = new BinaryExpr("/", expr, parseUnary());
                    continue;
                }
                break;
            }
            return expr;
        }

        private Expr parseUnary() {
            if (matchOp("+")) {
                return parseUnary();
            }
            if (matchOp("-")) {
                return new UnaryExpr("-", parseUnary());
            }
            return parsePrimary();
        }

        private Expr parsePrimary() {
            Token token = peek();
            if (match(TokenType.NUMBER)) {
                return new NumberExpr(new BigDecimal(token.text));
            }
            if (match(TokenType.STRING)) {
                return new StringExpr(token.text);
            }
            if (match(TokenType.IDENT)) {
                String name = token.text;
                if (match(TokenType.LPAREN)) {
                    return parseFunction(name);
                }
                return new IdentifierExpr(name);
            }
            if (match(TokenType.LPAREN)) {
                Expr expr = parseExpression();
                expect(TokenType.RPAREN, "缺少右括号");
                return expr;
            }
            throw new IllegalArgumentException("无法解析表达式");
        }

        private Expr parseFunction(String name) {
            if ("SUM".equalsIgnoreCase(name)) {
                Expr expr = parseExpression();
                Condition condition = null;
                if (matchKeyword("WHERE")) {
                    condition = parseCondition();
                }
                expect(TokenType.RPAREN, "缺少右括号");
                if (condition == null && matchKeyword("WHERE")) {
                    condition = parseCondition();
                }
                return new SumExpr(expr, condition);
            }
            if ("ROUND".equalsIgnoreCase(name)) {
                Expr expr = parseExpression();
                expect(TokenType.COMMA, "缺少逗号");
                Expr scale = parseExpression();
                expect(TokenType.RPAREN, "缺少右括号");
                return new RoundExpr(expr, scale);
            }
            if ("IF".equalsIgnoreCase(name)) {
                Condition condition = parseCondition();
                expect(TokenType.COMMA, "缺少逗号");
                Expr trueExpr = parseExpression();
                expect(TokenType.COMMA, "缺少逗号");
                Expr falseExpr = parseExpression();
                expect(TokenType.RPAREN, "缺少右括号");
                return new IfExpr(condition, trueExpr, falseExpr);
            }
            throw new IllegalArgumentException("未知函数: " + name);
        }

        private Condition parseCondition() {
            return parseOrCondition();
        }

        private Condition parseOrCondition() {
            Condition condition = parseAndCondition();
            while (matchKeyword("OR")) {
                condition = new LogicalCondition("OR", condition, parseAndCondition());
            }
            return condition;
        }

        private Condition parseAndCondition() {
            Condition condition = parseAtomCondition();
            while (matchKeyword("AND")) {
                condition = new LogicalCondition("AND", condition, parseAtomCondition());
            }
            return condition;
        }

        private Condition parseAtomCondition() {
            if (match(TokenType.LPAREN)) {
                Condition condition = parseCondition();
                expect(TokenType.RPAREN, "缺少右括号");
                return condition;
            }
            return parseComparison();
        }

        private Condition parseComparison() {
            Expr left = parseExpression();
            if (matchKeyword("IN")) {
                expect(TokenType.LPAREN, "缺少左括号");
                List<Expr> options = new ArrayList<>();
                if (peek().type != TokenType.RPAREN) {
                    options.add(parseExpression());
                    while (match(TokenType.COMMA)) {
                        options.add(parseExpression());
                    }
                }
                expect(TokenType.RPAREN, "缺少右括号");
                return new InCondition(left, options);
            }
            String op = null;
            if (matchOp(">=")) {
                op = ">=";
            } else if (matchOp("<=")) {
                op = "<=";
            } else if (matchOp("!=")) {
                op = "!=";
            } else if (matchOp(">")) {
                op = ">";
            } else if (matchOp("<")) {
                op = "<";
            } else if (matchOp("=")) {
                op = "=";
            } else if (matchOp("==")) {
                op = "==";
            }
            if (op != null) {
                Expr right = parseExpression();
                return new CompareCondition(left, right, op);
            }
            return new TruthyCondition(left);
        }
    }
}

