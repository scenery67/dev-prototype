# 멀티 스테이지 빌드를 사용하여 이미지 크기 최적화
# Stage 1: 빌드 스테이지
FROM gradle:8.9-jdk21 AS build

WORKDIR /app

# Gradle 의존성 캐시를 활용하기 위해 build.gradle과 settings.gradle을 먼저 복사
COPY build.gradle settings.gradle ./
COPY gradle ./gradle

# 의존성 다운로드 (캐시 활용)
RUN gradle dependencies --no-daemon || true

# 소스 코드 복사
COPY src ./src

# 애플리케이션 빌드 (bootJar 태스크로 실행 가능한 JAR 생성)
RUN gradle bootJar --no-daemon -x test

# Stage 2: 실행 스테이지
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# 헬스체크를 위한 wget 설치
RUN apk add --no-cache wget

# 빌드된 JAR 파일 복사 (Spring Boot는 bootJar로 실행 가능한 JAR 생성)
COPY --from=build /app/build/libs/chat-server-*.jar app.jar

# 포트 노출
EXPOSE 8080

# 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "app.jar"]
