export const ALLOW_MARKER = 'secret-scan:allow';
const SHOWN_PREFIX = 6;

const SECRET_PATTERNS: { name: string; pattern: RegExp }[] = [
  { name: 'Anthropic key/token', pattern: /sk-ant-(?:api|oat|admin)\d*-[A-Za-z0-9_-]{20,}/g },
  { name: 'OpenAI key', pattern: /sk-(?!ant-)(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}/g },
  { name: 'GitHub token', pattern: /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})/g },
  { name: 'Google API key', pattern: /AIza[0-9A-Za-z_-]{35}/g },
  { name: 'AWS access key', pattern: /(?:AKIA|ASIA)[0-9A-Z]{16}/g },
  { name: 'Stripe live key', pattern: /(?:sk|rk)_live_[A-Za-z0-9]{20,}/g },
  { name: 'Slack token', pattern: /xox[abprs]-[A-Za-z0-9-]{10,}/g },
  { name: 'Private key', pattern: /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/g },
];

const FORBIDDEN_PATHS: { name: string; pattern: RegExp }[] = [
  { name: 'dữ liệu chạy (token, DB, log)', pattern: /^data\// },
  { name: 'file .env', pattern: /(?:^|\/)\.env(?:\.(?!example$)[^/]+)?$/ },
  { name: 'khoá / chứng chỉ', pattern: /\.(?:pem|key|p12|pfx|jks|keystore|mobileprovision)$/ },
  { name: 'cấu hình ký / Firebase', pattern: /(?:^|\/)(?:key\.properties|google-services\.json|GoogleService-Info\.plist)$/ },
  { name: 'SSH key', pattern: /(?:^|\/)id_(?:rsa|ed25519)/ },
];

export type SecretFinding = { file: string; line: number | null; kind: string; preview: string };

/**
 * Che giá trị bí mật: chỉ hiện vài ký tự đầu và độ dài.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function maskSecret(value: string): string {
  return `${value.slice(0, SHOWN_PREFIX)}…(${value.length} ký tự)`;
}

/**
 * File thuộc loại cấm đưa lên repo (.env, khoá, chứng chỉ…) thì trả lý do, không thì null.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function forbiddenPathReason(file: string): string | null {
  return FORBIDDEN_PATHS.find(({ pattern }) => pattern.test(file))?.name ?? null;
}

/**
 * Tìm key/token trong nội dung một file (dòng có `secret-scan:allow` được bỏ qua);
 * [literal] là một bí mật cụ thể cần chặn thêm (vd token orchestrator thật).
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function scanSecrets(file: string, text: string, literal: { kind: string; value: string } | null = null): SecretFinding[] {
  const findings: SecretFinding[] = [];
  text.split('\n').forEach((lineText, index) => {
    if (lineText.includes(ALLOW_MARKER)) return;
    if (literal && lineText.includes(literal.value)) findings.push({ file, line: index + 1, kind: literal.kind, preview: maskSecret(literal.value) });
    for (const { name, pattern } of SECRET_PATTERNS) {
      for (const match of lineText.matchAll(pattern)) findings.push({ file, line: index + 1, kind: name, preview: maskSecret(match[0]) });
    }
  });
  return findings;
}

/**
 * Một dòng mô tả phát hiện (đã che giá trị) để in ra log / báo lên web.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function describeFinding(finding: SecretFinding): string {
  const where = finding.line === null ? finding.file : `${finding.file}:${finding.line}`;
  return `${where}  ${finding.kind}${finding.preview ? `  ${finding.preview}` : ''}`;
}
