package com.costsystem.modules.costtemplate.service;

import com.costsystem.common.exception.BusinessException;
import com.costsystem.modules.costtemplate.dto.TemplateCreateRequest;
import com.costsystem.modules.costtemplate.dto.TemplateInfo;
import com.costsystem.modules.costtemplate.dto.TemplateUpdateRequest;
import com.costsystem.modules.costtemplate.entity.Template;
import com.costsystem.modules.costtemplate.repository.TemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 模板服务
 */
@Service
public class TemplateService {

    private final TemplateRepository templateRepository;

    public TemplateService(TemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    @Transactional(readOnly = true)
    public List<TemplateInfo> listTemplates(String status) {
        List<Template> templates;
        if (status == null || status.isBlank()) {
            templates = templateRepository.findAllByOrderByUpdatedAtDesc();
        } else {
            Template.TemplateStatus templateStatus = parseStatus(status);
            templates = templateRepository.findByStatusOrderByUpdatedAtDesc(templateStatus);
        }
        return templates.stream().map(this::toInfo).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TemplateInfo> listPublishedTemplates() {
        return templateRepository.findByStatusOrderByUpdatedAtDesc(Template.TemplateStatus.PUBLISHED)
                .stream()
                .map(this::toInfo)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TemplateInfo getTemplate(Long templateId) {
        Template template = loadTemplate(templateId);
        return toInfo(template);
    }

    @Transactional
    public TemplateInfo createTemplate(TemplateCreateRequest request) {
        Template template = new Template();
        template.setName(request.getName().trim());
        template.setTemplateVersion(request.getTemplateVersion().trim());
        template.setSchemaJson(request.getSchemaJson().trim());
        template.setStatus(Template.TemplateStatus.DRAFT);
        return toInfo(templateRepository.save(template));
    }

    @Transactional
    public TemplateInfo updateTemplate(Long templateId, TemplateUpdateRequest request) {
        Template template = loadTemplate(templateId);
        if (template.getStatus() == Template.TemplateStatus.PUBLISHED) {
            throw BusinessException.conflict("已发布模板不允许直接修改，请先禁用后重新创建新版本模板");
        }

        template.setName(request.getName().trim());
        template.setTemplateVersion(request.getTemplateVersion().trim());
        template.setSchemaJson(request.getSchemaJson().trim());
        return toInfo(templateRepository.save(template));
    }

    @Transactional
    public TemplateInfo publishTemplate(Long templateId) {
        Template target = loadTemplate(templateId);
        if (target.getStatus() == Template.TemplateStatus.DISABLED) {
            throw BusinessException.conflict("已禁用模板不能直接发布，请先更新为草稿后再发布");
        }

        List<Template> publishedTemplates = templateRepository.findByStatusOrderByUpdatedAtDesc(Template.TemplateStatus.PUBLISHED);
        for (Template template : publishedTemplates) {
            if (!Objects.equals(template.getId(), target.getId())) {
                template.setStatus(Template.TemplateStatus.DISABLED);
                templateRepository.save(template);
            }
        }

        target.setStatus(Template.TemplateStatus.PUBLISHED);
        return toInfo(templateRepository.save(target));
    }

    @Transactional
    public TemplateInfo disableTemplate(Long templateId) {
        Template template = loadTemplate(templateId);
        template.setStatus(Template.TemplateStatus.DISABLED);
        return toInfo(templateRepository.save(template));
    }

    private Template loadTemplate(Long templateId) {
        return templateRepository.findById(templateId)
                .orElseThrow(() -> BusinessException.notFound("模板不存在"));
    }

    private Template.TemplateStatus parseStatus(String status) {
        try {
            return Template.TemplateStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw BusinessException.badRequest("无效模板状态: " + status);
        }
    }

    private TemplateInfo toInfo(Template template) {
        return new TemplateInfo(
                template.getId(),
                template.getName(),
                template.getTemplateVersion(),
                template.getStatus().name(),
                template.getSchemaJson(),
                template.getCreatedAt(),
                template.getUpdatedAt()
        );
    }
}
