import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HelpPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="max-w-2xl space-y-8">
      {session.user.role === "teacher" ? <TeacherHelp /> : <StudentHelp />}
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
          "「生徒一覧」→「生徒を招待」で生徒を登録する",
          "「設定」→「通知」でLINE連携を行う（任意・推奨）",
          "「予定」で最初の授業を登録する",
        ]} />
      </div>

      {/* 生徒を招待する */}
      <SectionCard title="生徒を招待する">
        <Steps items={[
          "「生徒一覧」→「生徒を招待」で名前・学年を入力します。",
          "生成された招待URLをLINE・メール等で生徒に送ります。",
          "生徒がリンクを開いてパスワードを設定すると登録完了です。",
        ]} />
        <Tip>招待リンクは7日間有効。「招待管理」ページで再コピーや取り消しができます。期限切れになったら「生徒を招待」から再作成してください。</Tip>
      </SectionCard>

      {/* 生徒を管理する */}
      <SectionCard title="生徒を管理する">
        <BulletList items={[
          { label: "学年変更", desc: "生徒一覧の「学年変更」で新学年に更新できます。" },
          { label: "パスワードリセット", desc: "「PW変更」から直接設定できます。生徒がパスワードを忘れた時に使用してください。" },
          { label: "時給・交通費のデフォルト", desc: "「時給・交通費を設定」をクリックすると、授業登録時に自動入力されます。" },
          { label: "生徒削除", desc: "宿題・成績データも含めて削除されます（取り消し不可）。" },
        ]} />
      </SectionCard>

      {/* 宿題を出す */}
      <SectionCard title="宿題を出す">
        <Steps items={[
          "「宿題管理」→「宿題を作成」で生徒・タイトル・期限を入力します。",
          "「写真提出を必須にする」をオンにすると、生徒は写真なしで提出できなくなります。",
          "生徒が提出するとダッシュボードの「承認待ち」に表示されます。",
          "「確認する」から承認または差し戻しを行います。「一括承認」も可能です。",
        ]} />
        <Tip>差し戻しにはコメントを添えると生徒に伝わります。宿題詳細ページから期限の延長もできます。</Tip>
      </SectionCard>

      {/* 宿題を絞り込む */}
      <SectionCard title="宿題を絞り込む">
        <BulletList items={[
          { label: "タイトル検索", desc: "検索ボックスにキーワードを入力するとリアルタイムで絞り込めます。" },
          { label: "生徒フィルタ", desc: "特定の生徒の宿題だけを表示できます。" },
          { label: "科目タグフィルタ", desc: "科目ボタンを複数選択できます。教材に紐づいた科目タグでも絞り込めます。" },
          { label: "ソート", desc: "作成日順・期限順を切り替えられます。" },
        ]} />
      </SectionCard>

      {/* 授業を管理する */}
      <SectionCard title="授業を管理する">
        <Steps items={[
          "「予定（カレンダー）」で月表示または週表示を開きます。",
          "日付をタップして「授業を追加」から生徒・日時・形式・時間・科目を入力します。",
          "「週次繰り返し」で最大12週分まとめて登録できます。",
          "授業終了後は「完了」ボタンを押すと請求管理に反映されます。",
        ]} />
        <Tip>授業カードの「編集」から授業ログ（指導内容・次回目標）を記録できます。「生徒に公開する」をオンにすると生徒も閲覧できます。</Tip>
      </SectionCard>

      {/* 請求管理 */}
      <SectionCard title="請求管理">
        <BulletList items={[
          { label: "対象授業", desc: "「完了」マークをつけた授業のみが請求に反映されます（未完了は除外）。" },
          { label: "料金計算", desc: "授業料 = 時給 × 時間（時）。対面授業は交通費が加算されます。" },
          { label: "月のナビゲーション", desc: "画面上部の矢印で月を切り替えられます。" },
          { label: "支払い記録", desc: "「支払い済みにする」で記録でき、月次サマリーで管理できます。" },
        ]} />
      </SectionCard>

      {/* 成績を記録する */}
      <SectionCard title="成績を記録する">
        <Steps items={[
          "「成績管理」→「成績を記録」でテスト名・日付・生徒を選びます。",
          "得点・順位・偏差値は任意入力です。わかる範囲で入力してください。",
          "科目タグや主観評価・コメントも記録できます。",
        ]} />
        <Tip>成績が入力されると、スコアに応じた植物が生徒の「学習の森」に育ちます。満点で竹、90%以上で桜が育ちます。</Tip>
      </SectionCard>

      {/* 科目タグ */}
      <SectionCard title="科目タグ">
        <p>「設定」→「タグ管理」から科目タグを作成・削除できます。宿題・成績・授業・教材に紐づけることで、絞り込みフィルターとして活用できます。</p>
      </SectionCard>

      {/* 教材を登録する */}
      <SectionCard title="教材を登録する">
        <p>「生徒一覧」→ 生徒名 →「教材」から、その生徒の使用教材を登録できます。</p>
        <BulletList items={[
          { label: "科目タグとの紐づけ", desc: "教材に科目タグを設定しておくと、宿題の科目フィルターで教材経由の宿題も絞り込めます。" },
          { label: "宿題への紐づけ", desc: "宿題作成時に教材を選択できます。生徒も自分の教材一覧を確認できます。" },
          { label: "タグの編集", desc: "登録後もペンアイコンから科目タグをいつでも編集できます。" },
        ]} />
      </SectionCard>

      {/* LINE・Meet */}
      <SectionCard title="LINE通知・Meet連携">
        <p className="font-medium text-xs text-muted-foreground mb-1">LINE通知（先生への通知）</p>
        <Steps items={[
          "「設定」→「LINE連携を開始する」をタップします。",
          "表示された6桁のコードをkatekyoのLINE公式アカウントに送信します。",
          "連携完了後、生徒の提出時・週次サマリーがLINEに届きます。",
        ]} />
        <p className="font-medium text-xs text-muted-foreground mt-3 mb-1">Google Meet（オンライン授業）</p>
        <p>「設定」でMeetのパーソナルルームURLを登録しておくと、授業カードに「Meet に参加する」ボタンが表示されます。オンライン授業の10分前に生徒のLINEへ自動でリンクが送られます（生徒がLINE連携済みの場合）。</p>
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
          "先生から送られた招待URLを開いてアカウントを作成する",
          "「設定」→「LINE連携」を行う（任意・推奨）",
          "「宿題」メニューで宿題を確認する",
        ]} />
      </div>

      {/* アカウント作成 */}
      <SectionCard title="招待を受けてアカウントを作る">
        <Steps items={[
          "先生から送られた招待URLをブラウザで開きます。",
          "メールアドレスとパスワード（8文字以上）を入力して「アカウントを作成」します。",
          "ログインページに移動するので、設定したメールとパスワードでログインします。",
        ]} />
        <Tip>すでにログイン中の場合は、先にログアウトしてから招待リンクを開いてください。パスワードを忘れた場合は先生にリセットを依頼してください。</Tip>
      </SectionCard>

      {/* 宿題 */}
      <SectionCard title="宿題を確認・提出する">
        <Steps items={[
          "「宿題」メニューを開くと「やること」に未完了の宿題が表示されます。",
          "「提出する」ボタンから完了報告をします。難易度評価やコメントも添えられます。",
          "写真提出が必要な宿題は、代表的なページを1枚だけ撮影して添付してください。",
          "先生が確認後、「承認」または「差し戻し」の結果が届きます。",
        ]} />
        <Tip>提出後に取り消したい場合は、承認待ち欄の「取り消す」ボタンを使ってください。差し戻しになった場合はコメントを確認して再提出してください。</Tip>
      </SectionCard>

      {/* 授業・カレンダー */}
      <SectionCard title="授業・カレンダーを確認する">
        <Steps items={[
          "「予定（カレンダー）」を開くと授業と宿題期限がカレンダーに表示されます。",
          "日付をタップすると授業の詳細（時刻・形式・先生のメモ）が確認できます。",
          "オンライン授業には「Meet に参加する」ボタンが表示されます。",
        ]} />
        <Tip>ダッシュボード（ホーム）でも今週の授業と期限が一目で確認できます。授業ログが公開されている場合はカレンダーでも閲覧できます。</Tip>
      </SectionCard>

      {/* 成績 */}
      <SectionCard title="成績を確認する">
        <p>「成績」メニューを開くと過去のテスト結果が一覧・グラフで表示されます。点数・偏差値の推移を視覚的に確認できます。</p>
        <Tip>成績の入力は先生が行います。テスト後に結果を先生に共有してください。</Tip>
      </SectionCard>

      {/* 教材 */}
      <SectionCard title="教材を確認する">
        <p>先生に登録してもらった教材の一覧を「教材」メニューから確認できます。教材には科目タグが付いている場合があります。</p>
      </SectionCard>

      {/* 学習の森 */}
      <SectionCard title="学習の森">
        <p className="mb-2">宿題が承認されたりテストで好成績を取ると、森にアイテムが育ちます。</p>
        <div className="bg-muted rounded-md p-3 space-y-1 text-xs">
          <p><span className="font-semibold">🎋 竹</span>　満点 / 偏差値70以上（超レア）</p>
          <p><span className="font-semibold">🌸 桜</span>　90%以上 / 偏差値65以上（レア）</p>
          <p><span className="font-semibold">🌳 大木</span>　80〜89% / 偏差値60〜64</p>
          <p><span className="font-semibold">🌲 木</span>　宿題承認時にランダムで出現</p>
          <p><span className="font-semibold">🌿 茂み / 🌼 花</span>　60〜79% / 偏差値50〜59 など</p>
          <p><span className="font-semibold">🍄 きのこ</span>　宿題承認時に低確率で出現（ラッキー！）</p>
        </div>
        <Tip>期限切れ・差し戻しの宿題があると古い植物が枯れますが、提出すると回復します。64個すべて育つと次の世代の森が始まります。</Tip>
      </SectionCard>

      {/* LINE通知 */}
      <SectionCard title="LINE通知を設定する">
        <Steps items={[
          "「設定」→「LINE連携を開始する」をタップします。",
          "表示された6桁のコードをkatekyoのLINE公式アカウントに送信します。",
          "連携完了です。",
        ]} />
        <Tip>連携すると、宿題の承認・差し戻し時や、毎朝の期限リマインダーがLINEに届きます。オンライン授業の10分前にMeetリンクも届きます。</Tip>
      </SectionCard>

      {/* アカウント設定 */}
      <SectionCard title="アカウント設定">
        <p>「設定」メニューから名前・パスワードの変更ができます。ログアウトはヘッダー右上のボタンから行えます。</p>
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
