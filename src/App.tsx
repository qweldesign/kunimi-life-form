import { useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

// ======== 型定義 ========
type Step = "form" | "confirm" | "done";

type Participant = {
  name: string;
  furigana: string;
  birthdate: string;
};

type FormData = {
  participants: Participant[];
  email: string;
  tel: string;
  telTime: string;
  zip: string;
  address: string;
  assemblyPoint: string;
  hasAllergy: string;
  allergyDetail: string;
  purpose: string;
  source: string;
};

type FormErrors = Partial<Record<string, string>>;

type Payload = Record<string, string>;

// ======== 定数 ========
const MAX_PARTICIPANTS = 6;
const ASSEMBLY_POINTS = ["福井駅", "国見公民館"] as const;

const emptyParticipant = (): Participant => ({ name: "", furigana: "", birthdate: "" });

const initialFormData = (): FormData => ({
  participants: [emptyParticipant()],
  email: "",
  tel: "",
  telTime: "",
  zip: "",
  address: "",
  assemblyPoint: "福井駅",
  hasAllergy: "無し",
  allergyDetail: "",
  purpose: "",
  source: "",
});

// ---- 郵便番号 → 住所 ----
async function fetchAddress(zip: string): Promise<string | null> {
  const clean = zip.replace(/[^0-9]/g, "");
  if (clean.length !== 7) return null;
  const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${clean}`);
  const json = await res.json();
  if (json.results) {
    const r = json.results[0];
    return r.address1 + r.address2 + r.address3;
  }
  return null;
}

// ---- 生年月日（YYYY/MM/DD）の自動整形 ----
function formatBirthdate(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "").slice(0, 8);
  if (digits.length > 6) {
    return digits.slice(0, 4) + "/" + digits.slice(4, 6) + "/" + digits.slice(6);
  }
  if (digits.length > 4) {
    return digits.slice(0, 4) + "/" + digits.slice(4);
  }
  return digits;
}

// ---- 生年月日（YYYY/MM/DD）の妥当性チェック ----
function isValidBirthdate(value: string): boolean {
  const match = value.trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match) return false;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d &&
    date <= new Date()
  );
}

// ======== 共通パーツ ========
type LabelProps = {
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
};

function Label({ children, required, optional }: LabelProps) {
  return (
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-600 ml-1">*</span>}
      {optional && <span className="text-gray-400 font-normal text-xs ml-1">任意</span>}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement>;

function Input({ className, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent ${className ?? ""}`}
    />
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

function Textarea(props: TextareaProps) {
  return (
    <textarea
      {...props}
      className="w-full border border-gray-300 rounded px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent resize-y"
    />
  );
}

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-red-600 text-xs mt-1">{msg}</p>;
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <tr className="border-b border-gray-200">
      <th className="text-left text-sm font-semibold bg-gray-50 px-3 py-2 w-2/5 text-gray-600">{label}</th>
      <td className="px-3 py-2 text-sm text-gray-800">{value}</td>
    </tr>
  );
}

// ======== 参加者フィールド ========
type ParticipantFieldsProps = {
  index: number;
  participant: Participant;
  onChange: (index: number, field: keyof Participant, value: string) => void;
  onChangeBirthdate: (index: number, raw: string) => void;
  onRemove: () => void;
  errors: FormErrors;
};

function ParticipantFields({ index, participant, onChange, onChangeBirthdate, onRemove, errors }: ParticipantFieldsProps) {
  return (
    <fieldset className="border border-gray-200 rounded-lg px-5 py-4 mb-4">
      <legend className="flex items-center gap-3 text-sm font-bold text-green-700 px-1">
        参加者 {index + 1}
        {index > 0 && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-red-500 border border-gray-300 rounded px-2 py-0.5 hover:bg-red-50 cursor-pointer"
          >
            削除
          </button>
        )}
      </legend>

      <div className="mb-3">
        <Label required>氏名</Label>
        <Input
          type="text"
          value={participant.name}
          onChange={(e) => onChange(index, "name", e.target.value)}
          placeholder="国見 まもる"
        />
        <ErrorMsg msg={errors[`name_${index}`]} />
      </div>

      <div className="mb-3">
        <Label required>フリガナ</Label>
        <Input
          type="text"
          value={participant.furigana}
          onChange={(e) => onChange(index, "furigana", e.target.value)}
          placeholder="クニミ マモル"
        />
        <ErrorMsg msg={errors[`furigana_${index}`]} />
      </div>

      <div className="mb-1">
        <Label required>生年月日</Label>
        <Input
          type="text"
          inputMode="numeric"
          value={participant.birthdate}
          onChange={(e) => onChangeBirthdate(index, e.target.value)}
          placeholder="1990/04/01"
          className="w-40"
        />
        <p className="text-xs text-gray-400 mt-1">例: 1990/04/01（西暦/月/日）</p>
        <ErrorMsg msg={errors[`birthdate_${index}`]} />
      </div>
    </fieldset>
  );
}

// ======== メインコンポーネント ========
export default function SurveyForm() {
  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState<FormData>(initialFormData());
  const [zipLoading, setZipLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // ---- 参加者操作 ----
  const handleParticipantChange = (index: number, field: keyof Participant, value: string) => {
    setFormData((prev) => {
      const participants = [...prev.participants];
      participants[index] = { ...participants[index], [field]: value };
      return { ...prev, participants };
    });
  };

  // ---- 生年月日自動整形 ----
  const handleBirthdateChange = (index: number, raw: string) => {
    const formatted = formatBirthdate(raw);
    setFormData((prev) => {
      const participants = [...prev.participants];
      participants[index] = { ...participants[index], birthdate: formatted };
      return { ...prev, participants };
    });
  };

  const addParticipant = () => {
    if (formData.participants.length >= MAX_PARTICIPANTS) return;
    setFormData((prev) => ({
      ...prev,
      participants: [...prev.participants, emptyParticipant()],
    }));
  };

  const removeParticipant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      participants: prev.participants.filter((_, i) => i !== index),
    }));
  };

  // ---- 郵便番号オートフィル ----
  const handleZipChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const zip = e.target.value;
    setFormData((prev) => ({ ...prev, zip }));
    if (zip.replace(/[^0-9]/g, "").length === 7) {
      setZipLoading(true);
      const addr = await fetchAddress(zip);
      setZipLoading(false);
      if (addr) setFormData((prev) => ({ ...prev, address: addr }));
    }
  };

  // ---- バリデーション ----
  const validate = (): FormErrors => {
    const e: FormErrors = {};
    formData.participants.forEach((p, i) => {
      if (!p.name.trim()) e[`name_${i}`] = "氏名を入力してください";
      if (!p.furigana.trim()) {
        e[`furigana_${i}`] = "フリガナを入力してください";
      } else if (!/^[ァ-ヶー\s　]+$/.test(p.furigana.trim())) {
        e[`furigana_${i}`] = "カタカナで入力してください";
      }
      if (!p.birthdate.trim()) {
        e[`birthdate_${i}`] = "生年月日を入力してください";
      } else if (!isValidBirthdate(p.birthdate)) {
        e[`birthdate_${i}`] = "正しい日付を入力してください（例: 1990/04/01）";
      }
    });
    if (!formData.email.trim()) {
      e.email = "メールアドレスを入力してください";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = "正しいメールアドレスを入力してください";
    }
    if (!formData.tel.trim()) e.tel = "電話番号を入力してください";
    if (!formData.address.trim()) e.address = "住所を入力してください";
    if (formData.hasAllergy === "有り" && !formData.allergyDetail.trim())
      e.allergyDetail = "アレルギーの内容を入力してください";
    return e;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setStep("confirm");
  };

  // ---- 送信 ----
  const handleSend = async () => {
    setSending(true);
    const payload: Payload = {};
    formData.participants.forEach((p, i) => {
      payload[`参加者${i + 1}_氏名`] = p.name;
      payload[`参加者${i + 1}_フリガナ`] = p.furigana;
      payload[`参加者${i + 1}_生年月日`] = p.birthdate;
    });
    payload["ご住所（郵便番号）"] = formData.zip;
    payload["ご住所"] = formData.address;
    payload["メールアドレス"] = formData.email;
    payload["電話番号"] = formData.tel;
    if (formData.telTime) payload["折り返し希望時間帯"] = formData.telTime;
    payload["集合場所"] = formData.assemblyPoint;
    payload["アレルギー"] =
      formData.hasAllergy === "有り" ? `有り（${formData.allergyDetail}）` : "無し";
    if (formData.purpose) payload["参加目的"] = formData.purpose;
    if (formData.source) payload["参加経緯"] = formData.source;
    payload["代表者様氏名"] = formData.participants[0].name;
    payload["Email"] = formData.email;

    try {
      const res = await fetch("./api/send.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStep("done");
      } else {
        const text = await res.text();
        console.error("Server error:", text);
        alert("送信に失敗しました（サーバーエラー）");
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("送信に失敗しました（通信エラー）");
    } finally {
      setSending(false);
    }
  };

  // ======== 完了画面 ========
  if (step === "done") {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-green-700">
          お申し込みありがとうございます
        </h2>
        <p className="text-gray-600">内容を確認の上、後日ご連絡いたします。</p>
      </div>
    );
  }

  // ======== 確認画面 ========
  if (step === "confirm") {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-green-700">
          入力内容の確認
        </h2>
        <table className="w-full border-collapse mb-6">
          <tbody>
            {formData.participants.map((p, i) => (
              <>
                <ConfirmRow key={`name_${i}`} label={`参加者${i + 1} 氏名`} value={p.name} />
                <ConfirmRow key={`fg_${i}`} label={`参加者${i + 1} フリガナ`} value={p.furigana} />
                <ConfirmRow key={`bd_${i}`} label={`参加者${i + 1} 生年月日`} value={p.birthdate} />
              </>
            ))}
            <ConfirmRow label="ご住所" value={`〒${formData.zip} ${formData.address}`} />
            <ConfirmRow label="メールアドレス" value={formData.email} />
            <ConfirmRow label="電話番号" value={formData.tel} />
            <ConfirmRow label="折り返し希望時間帯" value={formData.telTime} />
            <ConfirmRow label="集合場所" value={formData.assemblyPoint} />
            <ConfirmRow
              label="アレルギー"
              value={formData.hasAllergy === "有り" ? `有り（${formData.allergyDetail}）` : "無し"}
            />
            <ConfirmRow label="参加目的" value={formData.purpose} />
            <ConfirmRow label="参加経緯" value={formData.source} />
          </tbody>
        </table>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setStep("form")}
            disabled={sending}
            className="px-5 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            ← 修正する
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="px-6 py-2 bg-green-700 text-white font-bold rounded hover:bg-green-800 disabled:opacity-50 cursor-pointer"
          >
            {sending ? "送信中..." : "この内容で申し込む"}
          </button>
        </div>
      </div>
    );
  }

  // ======== 入力画面 ========
  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-green-700">
        ツアー参加申し込み
      </h2>
      <form onSubmit={handleSubmit} noValidate>

        {/* 参加者 */}
        {formData.participants.map((p, i) => (
          <ParticipantFields
            key={i}
            index={i}
            participant={p}
            onChange={handleParticipantChange}
            onChangeBirthdate={handleBirthdateChange}
            onRemove={() => removeParticipant(i)}
            errors={errors}
          />
        ))}

        {formData.participants.length < MAX_PARTICIPANTS && (
          <button
            type="button"
            onClick={addParticipant}
            className="w-full mb-5 py-2 border border-dashed border-green-600 rounded text-green-700 text-sm hover:bg-green-50 cursor-pointer"
          >
            ＋ 参加者を追加（最大{MAX_PARTICIPANTS}名）
          </button>
        )}

        {/* メールアドレス */}
        <div className="mb-4">
          <Label required>メールアドレス</Label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="example@example.com"
          />
          <ErrorMsg msg={errors.email} />
        </div>

        {/* 電話番号 */}
        <div className="mb-4">
          <Label required>電話番号</Label>
          <Input
            type="tel"
            value={formData.tel}
            onChange={(e) => setFormData((prev) => ({ ...prev, tel: e.target.value }))}
            placeholder="090-0000-0000"
            className="w-48"
          />
          <ErrorMsg msg={errors.tel} />
        </div>

        {/* 折り返し希望時間帯（任意） */}
        <div className="mb-4">
          <Label optional>折り返し希望時間帯</Label>
          <p className="text-sm text-gray-600 mb-2">
            確認のため折り返しお電話をさせて頂く場合がございます。ご都合の良い時間帯を教えてください。
          </p>
          <Textarea
            value={formData.telTime}
            onChange={(e) => setFormData((prev) => ({ ...prev, telTime: e.target.value }))}
            placeholder="例: 平日10時〜17時"
            rows={2}
          />
        </div>

        {/* 住所 */}
        <fieldset className="border border-gray-200 rounded-lg px-5 py-4 mb-4">
          <legend className="text-sm font-bold text-green-700 px-1">ご住所</legend>
          <div className="mb-3">
            <Label required>郵便番号</Label>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={formData.zip}
                onChange={handleZipChange}
                placeholder="9100000"
                maxLength={8}
                className="w-32"
              />
              {zipLoading && <span className="text-sm text-gray-400">検索中...</span>}
            </div>
          </div>
          <div className="mb-1">
            <Label required>住所</Label>
            <Input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="福井県福井市○○町1-2-3"
            />
            <ErrorMsg msg={errors.address} />
          </div>
        </fieldset>

        {/* 集合場所 */}
        <div className="mb-4">
          <Label required>集合場所</Label>
          <div className="flex gap-3 mt-1">
            {ASSEMBLY_POINTS.map((point) => (
              <label
                key={point}
                className={`flex-1 flex items-center gap-3 border-2 rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                  formData.assemblyPoint === point
                    ? "border-green-600 bg-green-50 text-green-800 font-semibold"
                    : "border-gray-200 hover:border-green-300 text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="assemblyPoint"
                  value={point}
                  checked={formData.assemblyPoint === point}
                  onChange={(e) => setFormData((prev) => ({ ...prev, assemblyPoint: e.target.value }))}
                  className="accent-green-700 w-4 h-4"
                />
                <span className="text-base">{point}</span>
              </label>
            ))}
          </div>
          <ErrorMsg msg={errors.assemblyPoint} />
        </div>

        {/* アレルギー */}
        <div className="mb-4">
          <Label required>アレルギーの有無</Label>
          <div className="flex gap-3 mt-1">
            {(["無し", "有り"] as const).map((v) => (
              <label
                key={v}
                className={`flex-1 flex items-center gap-3 border-2 rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                  formData.hasAllergy === v
                    ? "border-green-600 bg-green-50 text-green-800 font-semibold"
                    : "border-gray-200 hover:border-green-300 text-gray-700"
                }`}
              >
                <input
                  type="radio"
                  name="hasAllergy"
                  value={v}
                  checked={formData.hasAllergy === v}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hasAllergy: e.target.value }))}
                  className="accent-green-700 w-4 h-4"
                />
                <span className="text-base">{v}</span>
              </label>
            ))}
          </div>
          <ErrorMsg msg={errors.hasAllergy} />
        </div>

        {formData.hasAllergy === "有り" && (
          <div className="mb-4">
            <Label required>アレルギーの内容</Label>
            <Input
              type="text"
              value={formData.allergyDetail}
              onChange={(e) => setFormData((prev) => ({ ...prev, allergyDetail: e.target.value }))}
              placeholder="例: 卵、小麦"
            />
            <ErrorMsg msg={errors.allergyDetail} />
          </div>
        )}

        {/* 参加目的（任意） */}
        <div className="mb-4">
          <Label optional>当ツアーに期待するもの</Label>
          <Textarea
            value={formData.purpose}
            onChange={(e) => setFormData((prev) => ({ ...prev, purpose: e.target.value }))}
            rows={3}
          />
        </div>

        {/* 参加経緯（任意） */}
        <div className="mb-4">
          <Label optional>当ツアーを知った経緯</Label>
          <Textarea
            value={formData.source}
            onChange={(e) => setFormData((prev) => ({ ...prev, source: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="px-6 py-2 bg-green-700 text-white font-bold rounded hover:bg-green-800 cursor-pointer"
          >
            確認画面へ →
          </button>
        </div>
      </form>
    </div>
  );
}
