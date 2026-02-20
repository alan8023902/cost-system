# Maven 配置说明

## ✅ 已完成配置

### 1. 本地仓库迁移到D盘

**配置文件位置**:
```
D:\download\apache-maven-3.9.11-bin\apache-maven-3.9.11\conf\settings.xml
```

**已设置的本地仓库路径**:
```xml
<localRepository>D:/Maven/repository</localRepository>
```

**仓库目录**:
```
D:\Maven\repository\
```

### 2. 已配置的镜像源

#### 阿里云中央仓库镜像
```xml
<mirror>
    <id>aliyun</id>
    <name>Aliyun Maven Repository</name>
    <url>https://maven.aliyun.com/repository/public</url>
    <mirrorOf>central</mirrorOf>
</mirror>
```

#### 阿里云Spring仓库镜像
```xml
<mirror>
    <id>aliyun-spring</id>
    <name>Aliyun Spring Repository</name>
    <url>https://maven.aliyun.com/repository/spring</url>
    <mirrorOf>spring-milestones</mirrorOf>
</mirror>
```

---

## 📦 验证配置

### 查看当前本地仓库位置
```bash
mvn help:evaluate -Dexpression=settings.localRepository -q -DforceStdout
```

**预期输出**: `D:\Maven\repository`

### 查看Maven版本信息
```bash
mvn -version
```

### 清理并重新下载依赖
```bash
# 进入项目目录
cd d:\项目需求\建材成本管理系统\cost-system\cost-backend

# 清理旧的构建产物
mvn clean

# 下载依赖到新仓库
mvn dependency:resolve
```

---

## 🔄 迁移旧的依赖(可选)

如果您之前已经在C盘下载了Maven依赖,可以迁移到新位置:

### 1. 找到旧仓库位置
默认位置通常是:
```
C:\Users\您的用户名\.m2\repository\
```

### 2. 复制到新位置
```bash
# 使用PowerShell复制(需要管理员权限)
xcopy "C:\Users\%USERNAME%\.m2\repository" "D:\Maven\repository" /E /I /H /Y
```

### 3. 删除旧仓库(可选,释放C盘空间)
```bash
# 请确认复制成功后再执行!
rmdir /S /Q "C:\Users\%USERNAME%\.m2\repository"
```

---

## 🎯 配置生效

配置已立即生效!下次使用Maven时,所有依赖都会下载到 `D:\Maven\repository\`

### 当前项目使用
```bash
cd d:\项目需求\建材成本管理系统\cost-system\cost-backend
mvn clean install
```

所有jar包都会下载到 `D:\Maven\repository\` 目录。

---

## 🔧 高级配置(可选)

### 1. 配置更多镜像源

如果需要更快的下载速度,可以添加更多镜像:

```xml
<!-- 华为云镜像 -->
<mirror>
    <id>huaweicloud</id>
    <name>Huawei Cloud Maven Repository</name>
    <url>https://repo.huaweicloud.com/repository/maven/</url>
    <mirrorOf>central</mirrorOf>
</mirror>

<!-- 腾讯云镜像 -->
<mirror>
    <id>tencentcloud</id>
    <name>Tencent Cloud Maven Repository</name>
    <url>https://mirrors.cloud.tencent.com/nexus/repository/maven-public/</url>
    <mirrorOf>central</mirrorOf>
</mirror>
```

### 2. 配置JVM内存参数

如果编译大型项目时内存不足,可以创建 `MAVEN_OPTS` 环境变量:

**Windows环境变量设置**:
```
变量名: MAVEN_OPTS
变量值: -Xms512m -Xmx2048m
```

**或在项目根目录创建 `.mvn/jvm.config` 文件**:
```
-Xms512m
-Xmx2048m
-XX:ReservedCodeCacheSize=512m
```

### 3. 设置下载线程数

在 `settings.xml` 中的 `<profiles>` 下添加:

```xml
<profile>
    <id>fast-download</id>
    <properties>
        <maven.artifact.threads>10</maven.artifact.threads>
    </properties>
</profile>

<activeProfiles>
    <activeProfile>fast-download</activeProfile>
</activeProfiles>
```

---

## 📊 磁盘空间管理

### 查看仓库大小
```bash
# PowerShell
Get-ChildItem -Path "D:\Maven\repository" -Recurse | Measure-Object -Property Length -Sum

# 或使用 du 命令(需要安装)
du -sh D:\Maven\repository
```

### 清理无用的依赖
```bash
# 清理所有项目的构建产物
mvn clean

# 清理本地仓库中的快照版本
mvn dependency:purge-local-repository -DmanualInclude=true

# 清理特定组的依赖
mvn dependency:purge-local-repository -DreResolve=false -DactTransitively=false -DgroupId=org.springframework
```

---

## ⚠️ 注意事项

1. **路径格式**: 
   - Windows下使用正斜杠 `/` 或反斜杠 `\` 都可以
   - 推荐使用 `/` 避免转义问题

2. **权限问题**:
   - 确保 Maven 对 `D:\Maven\repository` 目录有读写权限

3. **IDE配置**:
   - **IDEA**: File → Settings → Build, Execution, Deployment → Build Tools → Maven
     - Maven home path: `D:\download\apache-maven-3.9.11-bin\apache-maven-3.9.11`
     - User settings file: `D:\download\apache-maven-3.9.11-bin\apache-maven-3.9.11\conf\settings.xml`
     - Local repository: `D:\Maven\repository`
   
   - **Eclipse**: Window → Preferences → Maven → User Settings
     - User Settings: 选择上述 settings.xml 文件

4. **多用户场景**:
   - 如果多个用户共享同一台电脑,可以为每个用户创建独立的 settings.xml
   - 放在 `C:\Users\用户名\.m2\settings.xml`

---

## 🚀 验证新配置

运行以下命令测试配置:

```bash
# 1. 清理项目
cd d:\项目需求\建材成本管理系统\cost-system\cost-backend
mvn clean

# 2. 下载依赖
mvn dependency:resolve

# 3. 检查新仓库是否有文件
dir D:\Maven\repository

# 4. 编译项目
mvn compile

# 5. 运行项目
mvn spring-boot:run
```

如果一切正常,您应该在 `D:\Maven\repository` 下看到下载的jar包!

---

**配置完成时间**: 2026-02-08  
**Maven版本**: Apache Maven 3.9.11  
**Java版本**: JDK 21.0.9
