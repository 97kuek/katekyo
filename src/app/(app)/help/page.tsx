import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HelpPage() {
  const session = await auth()
  if (!session) redirect("/login")

  if (session.user.role === "teacher") {
    return <TeacherHelp />
  }
  return <StudentHelp />
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-white p-5 space-y-3">
      <h2 className="font-semibold text-base">{title}</h2>
      <div className="space-y-2 text-sm text-gray-700">{children}</div>
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </span>
      <p className="leading-relaxed">{children}</p>
    </div>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-blue-50 rounded-md p-3">
      <span className="text-blue-500 shrink-0">💡</span>
      <p className="text-sm text-blue-800 leading-relaxed">{children}</p>
    </div>
  )
}

function TeacherHelp() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">使い方ガイド（先生）</h1>
        <p className="text-sm text-muted-foreground mt-1">katekyo の主な機能と操作方法を説明します</p>
      </div>

      <Section title="🎓 生徒を招待する">
        <Step n={1}>「生徒」→「招待リンクを作成」で生徒の名前と学年を入力します。</Step>
        <Step n={2}>生成された招待URLをコピーして、LINE・メール等で生徒に送ります。</Step>
        <Step n={3}>生徒がリンクを開き、メールアドレスとパスワードを設定すると登録完了です。</Step>
        <Tip>招待リンクは7日間有効です。期限切れになったら「招待管理」から再作成してください。</Tip>
      </Section>

      <Section title="📚 宿題を出す">
        <Step n={1}>「宿題」→「宿題を作成」で生徒・タイトル・期限を入力します。</Step>
        <Step n={2}>内容・科目タグも追加できます（任意）。</Step>
        <Step n={3}>生徒が提出報告をすると、ダッシュボードの「承認待ち」に表示されます。</Step>
        <Step n={4}>「確認する」から内容を確認し、承認または差し戻しを行います。</Step>
        <Tip>差し戻しにはコメントを添えると生徒に伝わります。差し戻された宿題は生徒が再提出できます。</Tip>
      </Section>

      <Section title="📊 成績を記録する">
        <Step n={1}>「成績」→「成績を記録」でテスト名・日付・生徒を選びます。</Step>
        <Step n={2}>得点・順位・偏差値は任意入力です。わかる範囲で入力してください。</Step>
        <Step n={3}>科目タグや主観評価・コメントも記録できます。</Step>
        <Step n={4}>記録した成績は後から編集・削除できます。</Step>
        <Tip>生徒ごとのグラフは「生徒一覧」→「成績を見る」で確認できます。</Tip>
      </Section>

      <Section title="📅 授業スケジュールを管理する">
        <Step n={1}>「予定（カレンダー）」で月表示カレンダーを開きます。</Step>
        <Step n={2}>日付をタップして「授業を追加」から生徒・時刻・形式を入力します。</Step>
        <Step n={3}>青いドットが授業、オレンジのドットが宿題期限を示します。</Step>
        <Tip>ダッシュボードの「今後7日の授業」でも直近の授業を確認できます。</Tip>
      </Section>

      <Section title="👥 生徒を管理する">
        <div className="space-y-1.5">
          <p>• 学年変更：生徒一覧の「学年変更」で新学年に更新できます（新学期対応）。</p>
          <p>• 生徒削除：確認ダイアログの後、宿題・成績データも含めて削除されます。</p>
          <p>• 招待管理：未使用の招待リンクを一覧・取消しできます。</p>
        </div>
      </Section>

      <Section title="🏷️ 科目タグを使う">
        <p>「科目タグ」メニューから科目を作成しておくと、宿題・成績に紐づけができます。複数タグの絞り込みには今後対応予定です。</p>
      </Section>
    </div>
  )
}

function StudentHelp() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">使い方ガイド（生徒）</h1>
        <p className="text-sm text-muted-foreground mt-1">katekyo の使い方を説明します</p>
      </div>

      <Section title="📬 招待を受けてアカウントを作る">
        <Step n={1}>先生から送られてきた招待URLをブラウザで開きます。</Step>
        <Step n={2}>メールアドレスとパスワード（8文字以上）を入力して「アカウントを作成」します。</Step>
        <Step n={3}>ログインページに移動するので、設定したメールとパスワードでログインします。</Step>
        <Tip>すでにログイン中の場合は、先にログアウトしてから招待リンクを開いてください。</Tip>
      </Section>

      <Section title="📚 宿題を確認・提出する">
        <Step n={1}>「宿題」メニューを開くと「やること」に未完了の宿題が表示されます。</Step>
        <Step n={2}>宿題タイトルをタップすると詳細が確認できます。</Step>
        <Step n={3}>「提出する」ボタンから完了報告をします。コメントを添えることもできます。</Step>
        <Step n={4}>先生が確認後、「承認」または「差し戻し」の結果が届きます。</Step>
        <Tip>差し戻しになった場合はコメントを確認して再度提出してください。期限切れの宿題も提出できます。</Tip>
      </Section>

      <Section title="📊 成績を確認する">
        <Step n={1}>「成績」メニューを開くと過去のテスト結果が一覧で表示されます。</Step>
        <Step n={2}>グラフで点数・偏差値の推移を視覚的に確認できます。</Step>
        <Tip>成績の入力は先生が行います。テスト後に結果を先生に共有してください。</Tip>
      </Section>

      <Section title="📅 授業・宿題期限を確認する">
        <Step n={1}>「予定（カレンダー）」を開くと授業と宿題期限がカレンダーに表示されます。</Step>
        <Step n={2}>青いドットが授業、オレンジのドットが宿題期限です。</Step>
        <Step n={3}>日付をタップすると詳細が確認できます。</Step>
        <Tip>ダッシュボード（ホーム）でも今週の授業と期限が一目で確認できます。</Tip>
      </Section>

      <Section title="ログアウトするには">
        <p>画面右上のメニューからログアウトできます。ログアウト後は招待リンクなしではアカウント作成できません。パスワードを忘れた場合は先生に連絡してください。</p>
      </Section>
    </div>
  )
}
