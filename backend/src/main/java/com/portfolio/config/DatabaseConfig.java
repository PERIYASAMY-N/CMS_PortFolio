package com.portfolio.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    /**
     * Active only when DATABASE_URL env var is present (Render production).
     * Locally, spring.datasource.* from application.properties is used instead.
     *
     * Handles all Render URL formats:
     *   postgres://user:pass@host/db
     *   postgres://user:pass@host:5432/db
     *   postgresql://user:pass@host/db
     *   postgresql://user:pass@host:5432/db
     */
    @Bean
    @Primary
    @ConditionalOnExpression("#{systemEnvironment['DATABASE_URL'] != null}")
    public DataSource dataSource() {
        String rawUrl = System.getenv("DATABASE_URL");

        System.out.println("=== DatabaseConfig: DATABASE_URL detected, building DataSource ===");
        System.out.println("Raw URL: " + rawUrl);

        if (rawUrl == null || rawUrl.isBlank()) {
            throw new IllegalStateException("DATABASE_URL env var is set but empty");
        }

        try {
            // Normalise scheme so java.net.URI can parse it
            String normalised = rawUrl
                .replaceFirst("^postgresql://", "postgres://")
                .replaceFirst("^postgres://", "jdbc-parse://");

            URI uri = new URI(normalised);

            String host   = uri.getHost();
            int    port   = uri.getPort() == -1 ? 5432 : uri.getPort();
            // dbName may carry a leading slash
            String dbName = uri.getPath().replaceFirst("^/", "");

            // userInfo = "username:password"
            String userInfo = uri.getUserInfo();
            if (userInfo == null || !userInfo.contains(":")) {
                throw new IllegalStateException("Cannot parse username/password from DATABASE_URL");
            }
            // Split only on the FIRST colon — password may contain colons
            int    colonIdx  = userInfo.indexOf(':');
            String username  = userInfo.substring(0, colonIdx);
            String password  = userInfo.substring(colonIdx + 1);

            String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", host, port, dbName);

            System.out.println("JDBC URL : " + jdbcUrl);
            System.out.println("Host     : " + host);
            System.out.println("Port     : " + port);
            System.out.println("Database : " + dbName);
            System.out.println("Username : " + username);

            HikariConfig cfg = new HikariConfig();
            cfg.setJdbcUrl(jdbcUrl);
            cfg.setUsername(username);
            cfg.setPassword(password);
            cfg.setDriverClassName("org.postgresql.Driver");

            // Render internal connections work with 'prefer'; set DB_SSL_MODE=require for external DBs
            String sslMode = System.getenv("DB_SSL_MODE");
            cfg.addDataSourceProperty("sslmode", sslMode != null ? sslMode : "prefer");

            // Conservative pool for Render free tier
            cfg.setMaximumPoolSize(3);
            cfg.setMinimumIdle(1);
            cfg.setConnectionTimeout(30_000);
            cfg.setIdleTimeout(600_000);
            cfg.setMaxLifetime(1_800_000);
            cfg.setKeepaliveTime(60_000);

            System.out.println("=== DatabaseConfig: DataSource created successfully ===");
            return new HikariDataSource(cfg);

        } catch (IllegalStateException e) {
            System.out.println("DatabaseConfig ERROR: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.out.println("DatabaseConfig ERROR: " + e.getMessage());
            throw new RuntimeException("Failed to build DataSource from DATABASE_URL: " + e.getMessage(), e);
        }
    }
}
