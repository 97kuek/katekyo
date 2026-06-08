import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HelpPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const role = session.user.role

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {role === "teacher" ? <TeacherHelp /> : role === "parent" ? <ParentHelp /> : <StudentHelp />}
      <HomeScreenSection />
      <AboutSection />
    </div>
  )
}

// ---- 共通コンポーネント ----

function H1({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{children}</h1>
      <p className="text-sm text-muted-foreground mt-1">
        katekyo の使い方をまとめています
      </p>
    </div>
  )
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-3">
      <h2 className="font-semibold text-base">{title}</h2>
      <div className="space-y-2.5 text-sm text-foreground">{children}</div>
    </div>
  )
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            {i + 1}
          </span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ol>
  )
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-muted border border-border rounded-md p-3 mt-1">
      <span className="shrink-0 text-muted-foreground">💡</span>
      <p className="text-sm text-foreground leading-relaxed">{children}</p>
    </div>
  )
}

function BulletList({ items }: { items: { label: string; desc: string }[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map(({ label, desc }) => (
        <li key={label} className="flex gap-2">
          <span className="text-muted-foreground shrink-0">•</span>
          <span><strong>{label}</strong>：{desc}</span>
        </li>
      ))}
    </ul>
  )
}

// ---- 先生用ガイド ----

function TeacherHelp() {
  return (
    <div className="space-y-6">
      <H1>使い方ガイド（先生）</H1>

      {/* クイックスタート */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <p className="font-semibold">はじめてのセットアップ（3ステップ）</p>
        <Steps items={[
          "「生徒一覧」→「招待リンクを作成」で生徒を登録する",
          "「設定」→「通知」でLINE連携を行う（任意・推奨）",
          "「予定」で最初の授業を登録する",
        ]} />
      </div>

      {/* 生徒 */}
      <SectionCard title="生徒の招待と管理">
        <Steps items={[
          "「招待リンクを作成」で生成したURLをLINE・メールで生徒に送ります。",
          "生徒がリンクを開きパスワードを設定すると登録完了です。",
        ]} />
        <BulletList items={[
          { label: "生徒の詳細", desc: "一覧で生徒をタップすると、学年変更・パスワード再発行・時給/交通費の既定値・削除を行えます。" },
          { label: "教材", desc: "詳細ページの「教材」から使用教材を登録でき、科目タグや宿題に紐づけられます。" },
        ]} />
        <Tip>招待リンクは7日間有効です。「招待管理」から再コピー・取り消しができます。</Tip>
      </SectionCard>

      {/* 宿題 */}
      <SectionCard title="宿題を出す・確認する">
        <Steps items={[
          "「宿題管理」→「宿題を作成」で生徒・タイトル・期限を入力します（写真提出を必須にもできます）。",
          "生徒が提出するとダッシュボードの「承認待ち」に表示されます。",
          "「確認する」から承認・差し戻しを行います（「一括承認」も可。差し戻しはコメントを添えられます）。",
        ]} />
        <Tip>検索ボックス・生徒・科目タグで絞り込めます。科目タグは「設定」→「タグ管理」で作成します。</Tip>
      </SectionCard>

      {/* 授業・請求 */}
      <SectionCard title="授業と請求">
        <Steps items={[
          "「予定」で日付をタップし、生徒・日時・形式・時間を入力します（最大12週の繰り返し登録も可）。",
          "授業後に「完了」を押すと請求管理に反映されます。",
        ]} />
        <BulletList items={[
          { label: "料金", desc: "授業料 = 時給 × 時間。対面授業は交通費が加算され、完了した授業のみ集計されます。" },
          { label: "入金管理", desc: "請求管理で月ごとに「支払い済み」を記録できます。" },
        ]} />
      </SectionCard>

      {/* 成績・森 */}
      <SectionCard title="成績と学習の森">
        <p>「成績管理」→「成績を記録」でテスト名・日付・生徒・得点などを入力します（得点や偏差値は任意）。</p>
        <Tip>成績を入力すると、スコアに応じた植物が生徒の「学習の森」に育ちます（満点で竹、90%以上で桜など）。</Tip>
      </SectionCard>

      {/* LINE・Meet */}
      <SectionCard title="LINE通知・Meet連携">
        <p>「設定」→「LINE連携を開始する」で6桁コードを公式アカウントに送ると、提出通知や週次サマリーが届きます。MeetのパーソナルルームURLを登録すると授業カードに参加ボタンが表示され、オンライン授業の10分前に生徒へリンクが自動送信されます。</p>
      </SectionCard>
    </div>
  )
}

// ---- 生徒用ガイド ----

function StudentHelp() {
  return (
    <div className="space-y-6">
      <H1>使い方ガイド（生徒）</H1>

      {/* クイックスタート */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <p className="font-semibold">はじめてのセットアップ（3ステップ）</p>
        <Steps items={[
          "先生から届いた招待URLを開いてアカウントを作成する",
          "「設定」→「LINE連携」を行う（任意・推奨）",
          "「宿題」で宿題を確認する",
        ]} />
      </div>

      {/* 宿題 */}
      <SectionCard title="宿題を確認・提出する">
        <Steps items={[
          "「宿題」の「やること」から宿題を開き、「提出する」で完了報告します（難易度やコメントも添えられます）。",
          "写真提出が必要な宿題は、代表的なページを1枚だけ撮影して添付します。",
          "先生の確認後、承認または差し戻しの結果が届きます。差し戻しはコメントを見て再提出してください。",
        ]} />
      </SectionCard>

      {/* 授業・成績 */}
      <SectionCard title="授業・成績を確認する">
        <p>「予定」で授業と宿題期限を、「成績」で過去のテスト結果をグラフで確認できます。オンライン授業には「Meet に参加する」ボタンが表示されます。</p>
        <Tip>成績の入力は先生が行います。教材は「教材」メニューから確認できます。</Tip>
      </SectionCard>

      {/* 学習の森 */}
      <SectionCard title="学習の森">
        <p className="mb-2">宿題が承認されたりテストで好成績を取ると、森に植物が育ちます。</p>
        <div className="bg-muted rounded-md p-3 space-y-1 text-xs">
          <p><span className="font-semibold">🎋 竹</span>　満点 / 偏差値70以上（超レア）</p>
          <p><span className="font-semibold">🌸 桜</span>　90%以上 / 偏差値65以上（レア）</p>
          <p><span className="font-semibold">🌳 大木</span>　80〜89% / 偏差値60〜64</p>
          <p><span className="font-semibold">🌲 木 / 🍄 きのこ</span>　宿題承認時に出現（きのこは低確率でラッキー！）</p>
          <p><span className="font-semibold">🌿 茂み / 🌼 花</span>　60〜79% / 偏差値50〜59 など</p>
        </div>
        <Tip>期限切れ・差し戻しがあると古い植物が枯れますが、提出すると回復します。64個すべて育つと次の世代が始まります。</Tip>
      </SectionCard>

      {/* LINE通知 */}
      <SectionCard title="LINE通知を設定する">
        <p>「設定」→「LINE連携を開始する」で6桁コードをkatekyoの公式アカウントに送ると連携完了です。宿題の承認・差し戻しや毎朝の期限リマインダー、オンライン授業10分前のMeetリンクが届きます。</p>
      </SectionCard>
    </div>
  )
}

// ---- 保護者用ガイド ----

function ParentHelp() {
  return (
    <div className="space-y-6">
      <H1>使い方ガイド（保護者）</H1>

      <div className="rounded-lg border bg-card p-5 space-y-3">
        <p className="font-semibold">保護者アカウントでできること</p>
        <p className="text-sm">宿題・成績・授業スケジュール・請求・学習の森を閲覧できます。</p>
        <p className="text-xs text-muted-foreground">※ 閲覧専用です。宿題の提出・成績の入力などの操作は行えません。</p>
      </div>

      <SectionCard title="アカウント作成と連携">
        <Steps items={[
          "先生またはお子様から届いた招待URLを開きます。",
          "メールアドレスとパスワード（8文字以上）でアカウントを作成します。",
          "ログインするとお子様の情報が自動で連携されます。",
        ]} />
        <Tip>複数のお子様と連携している場合、各ページ上部のタブで表示を切り替えられます。招待リンクは7日間有効です。</Tip>
      </SectionCard>

      <SectionCard title="請求・入金状況を確認する">
        <p>「請求」で月ごとの授業内容と料金を確認できます。先生が入金確認を行った月には「入金済み」バッジが表示されます。月の切り替えは上部の矢印ボタンで行えます。</p>
      </SectionCard>

      <SectionCard title="アカウントを削除する">
        <p>「設定」→「アカウントの削除」から削除できます。削除してもお子様のアカウントや学習データには影響しません。</p>
      </SectionCard>
    </div>
  )
}

function HomeScreenSection() {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <h2 className="font-semibold text-base">ホーム画面に追加する</h2>
      <p className="text-sm text-muted-foreground">アプリのようにホーム画面から直接起動できます。</p>

      <div className="space-y-3 text-sm text-foreground">
        <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">iPhone / iPad（Safari）</p>
        <Steps items={[
          "Safari でこのサイトを開く",
          "画面下部の共有ボタン（□↑）をタップ",
          "「ホーム画面に追加」をタップ",
          "「追加」をタップして完了",
        ]} />
        <div className="flex gap-2 bg-muted border border-border rounded-md p-3">
          <span className="shrink-0 text-muted-foreground">ℹ</span>
          <p className="text-sm text-foreground leading-relaxed">Safari 以外のブラウザ（Chrome など）では追加できません。</p>
        </div>
      </div>

      <div className="space-y-3 text-sm text-foreground pt-1">
        <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">Android（Chrome）</p>
        <Steps items={[
          "Chrome でこのサイトを開く",
          "右上の ⋮ メニューをタップ",
          "「ホーム画面に追加」をタップ",
          "「追加」をタップして完了",
        ]} />
      </div>
    </div>
  )
}

function AboutSection() {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-2 text-sm text-muted-foreground">
      <p className="font-semibold text-foreground">katekyo について</p>
      <p>家庭教師と生徒の学習をサポートするWebアプリです。宿題・成績・授業スケジュールを一元管理し、学習の継続を「学習の森」として可視化します。</p>
      <div className="pt-2 space-y-0.5 text-xs text-muted-foreground border-t">
        <p>開発者：植木敬太郎　/ 　連絡先：ueki.keitaro@gmail.com</p>
        <p>技術スタック：Next.js · Prisma · Supabase · Tailwind CSS</p>
      </div>
    </div>
  )
}
