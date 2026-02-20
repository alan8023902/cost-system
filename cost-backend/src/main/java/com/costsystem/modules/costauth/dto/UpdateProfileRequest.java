package com.costsystem.modules.costauth.dto;

import jakarta.validation.constraints.Size;

/**
 * 更新个人信息请求DTO
 */
public class UpdateProfileRequest {

    @Size(max = 128, message = "邮箱长度不能超过128个字符")
    private String email;

    @Size(max = 20, message = "手机号长度不能超过20个字符")
    private String phone;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
