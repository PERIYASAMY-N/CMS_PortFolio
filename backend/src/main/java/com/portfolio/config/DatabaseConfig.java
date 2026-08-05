package com.portfolio.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;

import javax.sql.DataSource;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
public class DatabaseConfig {

    /**
     * This bean is active ONLY when the DATABASE_URL environment variable is set.
     * On Render, DATABASE_URL is injected automatically from the linked PostgreSQL service.
     * Locally, spring.datasource.* properties in application.properties are used instead.
     */
    @Bean
    @Primary
    @ConditionalOnExpression("#{systemEnvironment['DATABASE_URL'] != null}")
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");

        System.out.println("=== DATABASE CONFIG: Using DATABASE_URL env var ===");

        if (databaseUrl == null || databaseUrl.isEmpty()) {
            throw new RuntimeException("DATABASE_URL environment variable is not set!");
        }

        try {
            // Supports both postgres:// and postgresql:// URL schemes from Render/Supabase
            Pattern pattern = Pattern.compile(
                "^(?:postgres(?:ql)?)://([^:]+):(.+)@([^:@/]+):(\\d+)/(.+)$"
            );
            Matcher matcher = pattern.matcher(databaseUrl);

            if (!matcher.matches()) {
                throw new RuntimeException(
                    "DATABASE_URL format not recognized. Expected: postgres://user:pass@host:port/dbname. Got: " + databaseUrl
                );
            }

            String username = matcher.group(1);
            String password = matcher.group(2);
            String host     = matcher.group(3);
            int    port     = Integer.parseInt(matcher.group(4));
            String dbName   = matcher.group(5);

            String jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", host, port, dbName);

            System.out.println("JDBC URL  : " + jdbcUrl);
            System.out.println("Host      : " + host);
            System.out.println("Port      : " + port);
            System.out.println("Database  : " + dbName);
            System.out.println("Username  : " + username);

            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(jdbcUrl);
            config.setUsername(username);
            config.setPassword(password);
            config.setDriverClassName("org.postgresql.Driver");

            // SSL mode: Render internal connections use 'prefer', external use 'require'
            // Set DB_SSL_MODE=require on Render if using external/Supabase DB
            String sslMode = System.getenv("DB_SSL_MODE");
            if (sslMode == null) sslMode = "prefer";
            config.addDataSourceProperty("sslmode", sslMode);

            // Pool settings optimised for Render free tier (limited connections)
            config.setMaximumPoolSize(3);
            config.setMinimumIdle(1);
            config.setConnectionTimeout(30000);
            config.setIdleTimeout(600000);
            config.setMaxLifetime(1800000);
            config.setKeepaliveTime(60000);

            System.out.println("=== DATABASE CONFIG: DataSource created successfully ===");
            return new HikariDataSource(config);

        } catch (RuntimeException e) {
            System.out.println("DATABASE CONFIG ERROR: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.out.println("DATABASE CONFIG ERROR: " + e.getMessage());
            throw new RuntimeException("Failed to configure database: " + e.getMessage(), e);
        }
    }
}
