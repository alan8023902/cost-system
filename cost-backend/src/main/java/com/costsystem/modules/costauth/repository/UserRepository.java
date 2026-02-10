package com.costsystem.modules.costauth.repository;

import com.costsystem.modules.costauth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 用户数据访问层
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.username = :loginId OR u.phone = :loginId OR u.email = :loginId")
    Optional<User> findByUsernameOrPhoneOrEmail(@Param("loginId") String loginId);

    boolean existsByUsername(String username);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);
}
