import 'dart:io';

/// Mức target SDK Google Play yêu cầu năm 2026 (skill store-review P1).
const kRequiredTargetSdk = 36;

/// Bundle / application id của base — app thật bắt buộc phải đổi.
const kPlaceholderIds = ['com.example', 'vn.miastudio.app'];

/// Package → khoá Info.plist bắt buộc phải có câu giải thích (skill store-review A2).
const kUsageKeysByPackage = {
  'image_picker': [
    'NSPhotoLibraryUsageDescription',
    'NSCameraUsageDescription',
  ],
  'camera': ['NSCameraUsageDescription', 'NSMicrophoneUsageDescription'],
  'geolocator': ['NSLocationWhenInUseUsageDescription'],
  'location': ['NSLocationWhenInUseUsageDescription'],
  'record': ['NSMicrophoneUsageDescription'],
  'speech_to_text': [
    'NSMicrophoneUsageDescription',
    'NSSpeechRecognitionUsageDescription',
  ],
  'flutter_contacts': ['NSContactsUsageDescription'],
  'local_auth': ['NSFaceIDUsageDescription'],
};

/// Quyền Android nhạy cảm cần khai báo lý do trên Play Console (P5).
const kSensitivePermissions = [
  'READ_SMS',
  'RECEIVE_SMS',
  'READ_CALL_LOG',
  'ACCESS_BACKGROUND_LOCATION',
  'QUERY_ALL_PACKAGES',
  'MANAGE_EXTERNAL_STORAGE',
  'REQUEST_INSTALL_PACKAGES',
];

final _secretPattern = RegExp(
  r'''(AIza[0-9A-Za-z_\-]{35}|sk-[A-Za-z0-9]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)''',
);
final _insecureUrlPattern = RegExp(
  r'''http://(?!localhost|127\.0\.0\.1|10\.0\.2\.2)''',
);
final _printPattern = RegExp(r'(^|[^.\w])print\(');
final _placeholderPattern = RegExp(
  r'Lorem ipsum|\bTODO\b|\bFIXME\b',
  caseSensitive: false,
);
final _emojiPattern = RegExp(
  r'[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]',
  unicode: true,
);

/// Một kết quả kiểm: mã mục, mức (ĐẠT / KHÔNG ĐẠT / CẢNH BÁO), mô tả.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
class CheckResult {
  /// Tạo kết quả.
  /// Author: HoNgocKhanh
  /// Company: MiaStudio
  /// Time: 2026-10-17
  const CheckResult(this.code, this.level, this.message);

  final String code;
  final String level;
  final String message;
}

/// Kết quả ĐẠT / KHÔNG ĐẠT theo điều kiện.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
CheckResult _verdict(
  String code,
  bool passed,
  String okMessage,
  String failMessage,
) => CheckResult(
  code,
  passed ? 'ĐẠT' : 'KHÔNG ĐẠT',
  passed ? okMessage : failMessage,
);

/// Đọc file nếu có, không có thì chuỗi rỗng.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
String _read(String path) =>
    File(path).existsSync() ? File(path).readAsStringSync() : '';

/// Các dòng code Dart trong lib/ (bỏ file sinh tự động) kèm vị trí `file:dòng`.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
List<(String, String)> _libLines() {
  final lib = Directory('lib');
  if (!lib.existsSync()) return const [];
  final lines = <(String, String)>[];
  for (final file in lib.listSync(recursive: true).whereType<File>()) {
    if (!file.path.endsWith('.dart') || file.path.endsWith('.g.dart')) continue;
    final content = file.readAsLinesSync();
    for (var index = 0; index < content.length; index++) {
      lines.add(('${file.path}:${index + 1}', content[index]));
    }
  }
  return lines;
}

/// Vị trí (tối đa 3) các dòng khớp [pattern], bỏ dòng comment.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
List<String> _matches(List<(String, String)> lines, RegExp pattern) => [
  for (final (location, line) in lines)
    if (!line.trimLeft().startsWith('//') && pattern.hasMatch(line)) location,
].take(3).toList();

/// Kiểm mã nguồn: nội dung mẫu, bí mật, HTTP thường, print, emoji (S2, S7, điều lệnh).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
List<CheckResult> checkSource() {
  final lines = _libLines();
  final placeholders = _matches(lines, _placeholderPattern);
  final secrets = _matches(lines, _secretPattern);
  final insecure = _matches(lines, _insecureUrlPattern);
  final prints = _matches(lines, _printPattern);
  final emojis = _matches(lines, _emojiPattern);
  return [
    _verdict(
      'S2',
      placeholders.isEmpty,
      'Không còn nội dung mẫu (Lorem/TODO/FIXME)',
      'Còn nội dung mẫu: ${placeholders.join(', ')}',
    ),
    _verdict(
      'S7',
      secrets.isEmpty,
      'Không thấy khoá/secret trong code',
      'Lộ khoá/secret: ${secrets.join(', ')}',
    ),
    _verdict(
      'S7b',
      insecure.isEmpty,
      'Chỉ dùng HTTPS',
      'Có URL http:// không mã hoá: ${insecure.join(', ')}',
    ),
    _verdict(
      'DL1',
      prints.isEmpty,
      'Không dùng print (dùng logger)',
      'Còn print(): ${prints.join(', ')}',
    ),
    _verdict(
      'DL2',
      emojis.isEmpty,
      'Không dùng emoji trong code UI (dùng icon thư viện)',
      'Có emoji trong lib/: ${emojis.join(', ')}',
    ),
  ];
}

/// Kiểm iOS: bundle id, PrivacyInfo (có file và đã vào target), câu giải thích quyền (A1, A2, A5).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
List<CheckResult> checkIos() {
  final project = _read('ios/Runner.xcodeproj/project.pbxproj');
  final plist = _read('ios/Runner/Info.plist');
  final pubspec = _read('pubspec.yaml');
  final bundleIds = RegExp(
    r'PRODUCT_BUNDLE_IDENTIFIER = ([^;]+);',
  ).allMatches(project).map((match) => match.group(1)!).toSet();
  final placeholderIds = bundleIds
      .where((id) => kPlaceholderIds.any(id.startsWith))
      .toList();
  final hasPrivacyFile = File('ios/Runner/PrivacyInfo.xcprivacy').existsSync();
  final missingKeys = <String>{
    for (final MapEntry(key: package, value: keys)
        in kUsageKeysByPackage.entries)
      if (RegExp('^\\s+$package:', multiLine: true).hasMatch(pubspec))
        for (final key in keys)
          if (!RegExp(
            '<key>$key</key>\\s*<string>[^<]{8,}</string>',
          ).hasMatch(plist))
            key,
  };
  return [
    _verdict(
      'A5',
      bundleIds.isNotEmpty && placeholderIds.isEmpty,
      'Bundle ID riêng: ${bundleIds.join(', ')}',
      'Bundle ID còn mặc định: ${placeholderIds.join(', ')}',
    ),
    _verdict(
      'A1',
      hasPrivacyFile && project.contains('PrivacyInfo.xcprivacy'),
      'PrivacyInfo.xcprivacy có và đã vào target Runner',
      hasPrivacyFile
          ? 'PrivacyInfo.xcprivacy chưa được thêm vào target Runner (Xcode)'
          : 'Thiếu ios/Runner/PrivacyInfo.xcprivacy',
    ),
    _verdict(
      'A2',
      missingKeys.isEmpty,
      'Đủ câu giải thích quyền trong Info.plist',
      'Thiếu/quá ngắn câu giải thích: ${missingKeys.join(', ')}',
    ),
  ];
}

/// targetSdk mặc định của Flutter đang cài (đọc từ FlutterExtension.kt), không đọc được thì null.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
int? _flutterDefaultTargetSdk() {
  final result = Process.runSync('flutter', ['--version', '--machine']);
  final root = RegExp(
    r'"flutterRoot":\s*"([^"]+)"',
  ).firstMatch('${result.stdout}')?.group(1);
  if (root == null) return null;
  final source = _read(
    '$root/packages/flutter_tools/gradle/src/main/kotlin/FlutterExtension.kt',
  );
  final value = RegExp(
    r'val targetSdkVersion: Int = (\d+)',
  ).firstMatch(source)?.group(1);
  return value == null ? null : int.parse(value);
}

/// Kiểm Android: application id, targetSdk, quyền nhạy cảm (P1, P5, P6).
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
List<CheckResult> checkAndroid() {
  final gradle =
      _read('android/app/build.gradle.kts') + _read('android/app/build.gradle');
  final manifest = _read('android/app/src/main/AndroidManifest.xml');
  final applicationId =
      RegExp(
        r'''applicationId\s*=?\s*["']([^"']+)["']''',
      ).firstMatch(gradle)?.group(1) ??
      '';
  final explicitSdk = RegExp(
    r'targetSdk(?:Version)?\s*=?\s*(\d+)',
  ).firstMatch(gradle)?.group(1);
  final targetSdk = explicitSdk != null
      ? int.parse(explicitSdk)
      : _flutterDefaultTargetSdk();
  final sensitive = kSensitivePermissions
      .where(
        (permission) => manifest.contains('android.permission.$permission'),
      )
      .toList();
  return [
    _verdict(
      'P6',
      applicationId.isNotEmpty &&
          !kPlaceholderIds.any(applicationId.startsWith),
      'applicationId riêng: $applicationId',
      'applicationId còn mặc định: $applicationId',
    ),
    _verdict(
      'P1',
      (targetSdk ?? 0) >= kRequiredTargetSdk,
      'targetSdk $targetSdk ≥ $kRequiredTargetSdk',
      'targetSdk ${targetSdk ?? '?'} < $kRequiredTargetSdk (Play yêu cầu)',
    ),
    CheckResult(
      'P5',
      sensitive.isEmpty ? 'ĐẠT' : 'CẢNH BÁO',
      sensitive.isEmpty
          ? 'Không xin quyền nhạy cảm'
          : 'Quyền nhạy cảm cần khai báo lý do: ${sensitive.join(', ')}',
    ),
  ];
}

/// Máy tự kiểm các mục [MÁY] của skill store-review + điều lệnh, in bảng kết quả.
/// Thoát mã 1 nếu có mục KHÔNG ĐẠT. Chạy từ thư mục gốc project: `dart run tool/store_check.dart`.
/// Author: HoNgocKhanh
/// Company: MiaStudio
/// Time: 2026-10-17
void main() {
  final results = [...checkSource(), ...checkIos(), ...checkAndroid()];
  for (final result in results) {
    stdout.writeln(
      '[${result.level}] ${result.code.padRight(4)} ${result.message}',
    );
  }
  final failed = results.where((result) => result.level == 'KHÔNG ĐẠT').length;
  stdout.writeln(
    failed == 0 ? 'STORE CHECK: ĐẠT' : 'STORE CHECK: KHÔNG ĐẠT ($failed mục)',
  );
  exitCode = failed == 0 ? 0 : 1;
}
