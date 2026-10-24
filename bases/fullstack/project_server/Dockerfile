# Build: sinh entrypoint Dart Frog, biên dịch server + công cụ migrate thành file chạy độc lập.
FROM dart:3.11 AS build
WORKDIR /app
RUN dart pub global activate dart_frog_cli
COPY pubspec.yaml pubspec.lock ./
RUN dart pub get
COPY . .
RUN mkdir -p /app/bin \
 && dart pub global run dart_frog_cli:dart_frog build \
 && cd build && dart pub get \
 && dart compile exe bin/server.dart -o /app/bin/server \
 && cd .. && dart compile exe tool/migrate.dart -o /app/bin/migrate

# Chạy: image tối giản, chỉ kèm file đã biên dịch + migration; áp migration rồi khởi động.
FROM scratch
COPY --from=build /runtime/ /
COPY --from=build /app/bin/server /app/bin/migrate /app/bin/
COPY --from=build /app/db /app/db
WORKDIR /app
EXPOSE 8080
CMD ["/app/bin/server"]
