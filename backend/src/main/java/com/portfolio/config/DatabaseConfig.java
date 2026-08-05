package com.portfolio.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    @ConditionalOnProperty(name = "DATABASE_URL")
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");

        System.out.println("=== DATABASE CONFIG STARTING ===");
        System.out.println("DATABASE_URL found: " + (databaseUrl != null));

        if (databaseUrl == null || databaseUrl.isEmpty()) {
            throw new RuntimeException("DATABASE_URL environment variable is not set!");
        }

        try {
            // Supports both postgres:// and postgresql:// schemes
            // Handles special characters like @ in passwords
            // Pattern: scheme://username:password@host:port/dbname
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

            String jdbcUrl  = String.format(
                "jdbc:postgresql://%s:%d/%s", host, port, dbName
            );

            System.out.println("=== DATABASE CONFIG DEBUG ===");
            System.out.println("Parsed JDBC URL : " + jdbcUrl);
            System.out.println("Host            : " + host);
            System.out.println("Port            : " + port);
            System.out.println("Database        : " + dbName);
            System.out.println("Username        : " + username);
            System.out.println("=== END DATABASE CONFIG ===");

            HikariConfig config = new HikariConfig();
            config.setJdbcUrl(jdbcUrl);
            config.setUsername(username);
            config.setPassword(password);
            config.setDriverClassName("org.postgresql.Driver");
            // SSL: required for external/cloud DBs (Supabase, Render external), skip for Render internal
            String sslMode = System.getenv("DB_SSL_MODE");
            if (sslMode == null) sslMode = "prefer";
            config.addDataSourceProperty("ssl", "true");
            config.addDataSourceProperty("sslmode", sslMode);
            // Pool settings optimized for free tier
            config.setMaximumPoolSize(3);
            config.setMinimumIdle(1);
            config.setConnectionTimeout(30000);
            config.setIdleTimeout(600000);
            config.setMaxLifetime(1800000);
            config.setKeepaliveTime(60000);

            return new HikariDataSource(config);

        } catch (RuntimeException e) {
            System.out.println("ERROR: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.out.println("ERROR: Unexpected error: " + e.getMessage());
            throw new RuntimeException("Failed to configure database: " + e.getMessage(), e);
        }
    }
}
