<?php
require __DIR__ . '/vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

mb_language('Japanese');
mb_internal_encoding('UTF-8');

// 設定項目
// サイト設定
$site_title = '国見 海・人・暮らし相談室';
$site_url   = 'https://kunimi.life';
$admin_email = 'welcome@kunimi.life';

// SMTP設定（heteml想定）
$smtp_host = 'smtp.hetemail.jp';
$smtp_user = 'welcome@kunimi.life';
$smtp_pass = '******'; // ← 必ず書き換える!!
$smtp_port = 587;

// 署名設定
$mailFooter = <<< TEXT

後日ご連絡致しますので今しばらくお待ちください。

────────────────────────────────────────────────
国見 海・人・暮らし相談室
お問い合わせ: 0776-88-2004 (国見公民館)
────────────────────────────────────────────────

TEXT;

// 項目設定
$require_fields = ['代表者様氏名', 'Email', 'ご住所', '集合場所', 'アレルギー']; // 必須項目
$Email = 'Email'; // フォームのEmail入力箇所のname属性の値

// Origin & Referer チェック（CSRF対策）
// Originが不正 OR Refererが不正 → 弾く
$origin  = $_SERVER['HTTP_ORIGIN']  ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
if (
  ($origin  && strpos($origin,  $site_url) !== 0) ||
  ($referer && strpos($referer, $site_url) !== 0)
) {
  http_response_code(403);
  exit;
}

// データ取得
$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
  http_response_code(400);
  exit;
}

// バリデーション（必須項目）
foreach ($require_fields as $key) {
  if (empty($data[$key])) {
    http_response_code(400);
    exit;
  }
}

// Emailの厳密バリデーション
if (!filter_var($data[$Email], FILTER_VALIDATE_EMAIL)) {
  http_response_code(400);
  exit;
}

// ヘッダインジェクション対策
if (preg_match('/[\r\n]/', $data[$Email])) {
  http_response_code(400);
  exit('不正な入力が検出されました');
}

// メール本文作成
$mailBody = postToMail($data);

// 管理者宛（失敗したらエラーを返す）
try {
  $mail1 = makeSMTP($smtp_host, $smtp_user, $smtp_pass, $smtp_port);
  $mail1->setFrom($admin_email, $site_title);
  $mail1->addAddress($admin_email);
  $mail1->addReplyTo($data[$Email]);
  $mail1->Subject = "{$site_title} ツアー参加申し込み";
  $mail1->Body    = "以下の内容で受け付けました。\n\n" . $mailBody;
  $mail1->send();
} catch (Exception $e) {
  http_response_code(500);
  exit;
}

// 自動返信（失敗してもユーザーにはエラーを返さない）
try {
  $mail2 = makeSMTP($smtp_host, $smtp_user, $smtp_pass, $smtp_port);
  $mail2->setFrom($admin_email, $site_title);
  $mail2->addAddress($data[$Email]);
  $mail2->Subject = "{$site_title} ツアー参加申し込みを受け付けました";
  $mail2->Body    = "以下の内容で受け付けました。\n\n" . $mailBody . $mailFooter;
  $mail2->send();
} catch (Exception $e) {
  error_log('自動返信失敗: ' . $e->getMessage() . ' 宛先: ' . $data[$Email]);
}

http_response_code(204);

// ---- ヘルパー関数 ----

function makeSMTP(string $host, string $user, string $pass, int $port): PHPMailer {
  $mail = new PHPMailer(true);
  $mail->isSMTP();
  $mail->Host       = $host;
  $mail->SMTPAuth   = true;
  $mail->Username   = $user;
  $mail->Password   = $pass;
  $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
  $mail->Port       = $port;
  $mail->CharSet    = 'UTF-8';
  return $mail;
}

function postToMail(array $post): string {
  $body = '';
  foreach ($post as $key => $value) {
    if ($key === 'csrf_token') continue;
    if (is_array($value)) {
      $value = implode(', ', $value);
    }
    $body .= "{$key}: {$value}\n";
  }
  return $body;
}
