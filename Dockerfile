# Multi-stage build for Spring Boot application

# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy pom.xml and download dependencies
COPY backend/pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY backend/src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Copy the jar from builder stage
COPY --from=builder /app/target/portfolio-cms-*.jar app.jar

# Create uploads directory
RUN mkdir -p /app/uploads

# Expose port
EXPOSE 8080

# Run the application with prod profile active
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]
