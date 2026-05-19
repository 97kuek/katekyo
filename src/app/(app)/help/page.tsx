import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function HelpPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="space-y-8">
      <AboutSection />
      {session.user.role === "teacher" ? <TeacherHelp /> : <StudentHelp />}
    </div>
  )
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
        <Tip>招待リンクは7日間有効です。「招待管理」ページで有効なリンクの「URLをコピー」ボタンから再コピーできます。期限切れになったら「新しく招待する」から再作成してください。</Tip>
      </Section>

      <Section title="👥 生徒を管理する">
        <div className="space-y-1.5">
          <p>• <strong>ソート</strong>：生徒一覧の「並び替え」で登録日順・名前順・学年順・進捗順に切り替えられます。</p>
          <p>• <strong>学年変更</strong>：生徒一覧の「学年変更」で新学年に更新できます（新学期対応）。</p>
          <p>• <strong>パスワードリセット</strong>：生徒一覧の「PW変更」からパスワードを直接設定できます。生徒がパスワードを忘れた時に使ってください。</p>
          <p>• <strong>生徒削除</strong>：確認ダイアログの後、宿題・成績データも含めて削除されます。</p>
          <p>• <strong>招待管理</strong>：未使用の招待リンクを一覧・URLコピー・取消しできます。</p>
        </div>
      </Section>

      <Section title="📚 宿題を出す">
        <Step n={1}>「宿題」→「宿題を作成」で生徒・タイトル・期限を入力します。</Step>
        <Step n={2}>内容・科目タグも追加できます（任意）。</Step>
        <Step n={3}>生徒が提出報告をすると、ダッシュボードの「承認待ち」に表示されます。</Step>
        <Step n={4}>「確認する」から内容を確認し、承認または差し戻しを行います。複数まとめて「一括承認」も可能です。</Step>
        <Tip>差し戻しにはコメントを添えると生徒に伝わります。宿題詳細ページの「期限を延長」ボタンで期限の変更もできます。</Tip>
      </Section>

      <Section title="🔍 宿題を絞り込む">
        <div className="space-y-1.5">
          <p>• <strong>タイトル検索</strong>：検索ボックスにキーワードを入力するとタイトルで絞り込めます。</p>
          <p>• <strong>生徒フィルタ</strong>：特定の生徒の宿題だけを表示できます。</p>
          <p>• <strong>科目タグフィルタ</strong>：科目ボタンをクリックして複数選択できます。</p>
          <p>• <strong>ソート</strong>：作成日順・期限順を切り替えられます。</p>
        </div>
      </Section>

      <Section title="📊 成績を記録する">
        <Step n={1}>「成績」→「成績を記録」でテスト名・日付・生徒を選びます。</Step>
        <Step n={2}>得点・順位・偏差値は任意入力です。わかる範囲で入力してください。</Step>
        <Step n={3}>科目タグや主観評価・コメントも記録できます。</Step>
        <Step n={4}>記録した成績は後から編集・削除できます。</Step>
        <Tip>「生徒」セレクタで特定の生徒を絞り込むと、その生徒の成績グラフが表示されます。生徒個別の詳細は「生徒一覧」→「成績を見る」で確認できます。</Tip>
      </Section>

      <Section title="📅 授業スケジュールを管理する">
        <Step n={1}>「予定（カレンダー）」で月表示または週表示カレンダーを開きます。</Step>
        <Step n={2}>日付をタップして「授業を追加」から生徒・時刻・形式・時間を入力します。</Step>
        <Step n={3}>「週次繰り返し」で最大12週分まとめて登録できます。所要時間は前回入力値が自動でセットされます。</Step>
        <Tip>月/週の切り替えは左上のタブで行います。「今月」「今週」ボタンで現在の期間に素早く戻れます。青いドットが授業、オレンジのドットが宿題期限です。</Tip>
      </Section>

      <Section title="🏷️ 科目タグを使う">
        <p>「科目タグ」メニューから科目を作成しておくと、宿題・成績に紐づけができます。宿題一覧・成績一覧の科目ボタンで複数選択フィルタリングが可能です。</p>
      </Section>

      <Section title="📖 教材を登録する">
        <p>「生徒一覧」→生徒名→「教材」タブから、その生徒の教材を登録・管理できます。登録した教材は宿題作成時に紐づけでき、生徒も自分の教材一覧を確認できます。</p>
      </Section>

      <Section title="📋 宿題テンプレートを使う">
        <Step n={1}>「宿題テンプレート」メニューからよく使う宿題のタイトル・内容を登録しておきます。</Step>
        <Step n={2}>宿題作成時に「テンプレートから選ぶ」を選ぶと、タイトルと内容が自動入力されます。</Step>
        <Tip>毎週同じ宿題を出す場合など、入力の手間を省けます。テンプレートは後から編集・削除できます。</Tip>
      </Section>

      <Section title="💰 請求管理">
        <div className="space-y-1.5">
          <p>「請求管理」メニューで月別の授業料・交通費を確認できます。</p>
          <p>• <strong>時給・交通費のデフォルト設定</strong>：「生徒一覧」で各生徒の「時給・交通費を設定」をクリックすると、授業登録時に自動入力されます。</p>
          <p>• <strong>月のナビゲーション</strong>：画面上部の矢印で月を切り替えられます。</p>
          <p>• <strong>計算方法</strong>：授業料 = 時給 × 時間（時間）、対面授業は交通費が加算されます。</p>
        </div>
        <Tip>カレンダーで授業を登録する際、生徒を選ぶと時給・交通費が自動で入力されます（「生徒一覧」でデフォルト設定済みの場合）。</Tip>
      </Section>

      <Section title="🔔 LINE通知を設定する（先生）">
        <Step n={1}>「設定」メニューを開き、「LINE連携を開始する」をタップします。</Step>
        <Step n={2}>6桁のコードが表示されたら、QRコードまたはリンクから katekyo の LINE 公式アカウントを友だち追加します。</Step>
        <Step n={3}>LINE のトーク画面に6桁のコードを送信すると連携完了です。</Step>
        <Tip>連携すると、生徒が宿題を提出したときに LINE へ通知が届きます。通知には宿題の確認ページへのリンクが含まれます。</Tip>
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
        <Tip>すでにログイン中の場合は、先にログアウトしてから招待リンクを開いてください。パスワードを忘れた場合は先生にパスワードリセットを依頼してください。</Tip>
      </Section>

      <Section title="📚 宿題を確認・提出する">
        <Step n={1}>「宿題」メニューを開くと「やること」に未完了の宿題が表示されます。</Step>
        <Step n={2}>「提出する」ボタンから完了報告をします。コメントを添えることもできます。</Step>
        <Step n={3}>先生が確認後、「承認」または「差し戻し」の結果が届きます。</Step>
        <Step n={4}>差し戻しになった場合はコメントを確認して再度提出してください。</Step>
        <Tip>提出後に取り消したい場合は、承認待ち欄の「取り消す」ボタンを使ってください。期限切れの宿題も提出できます。</Tip>
      </Section>

      <Section title="📊 成績を確認する">
        <Step n={1}>「成績」メニューを開くと過去のテスト結果が一覧で表示されます。</Step>
        <Step n={2}>グラフで点数・偏差値の推移を視覚的に確認できます。科目別にフィルタリングも可能です。</Step>
        <Tip>成績の入力は先生が行います。テスト後に結果を先生に共有してください。</Tip>
      </Section>

      <Section title="📅 授業・宿題期限を確認する">
        <Step n={1}>「予定（カレンダー）」を開くと授業と宿題期限がカレンダーに表示されます。</Step>
        <Step n={2}>月表示と週表示を切り替えられます。「今月」「今週」ボタンで現在の期間に戻れます。</Step>
        <Step n={3}>日付をタップすると授業の詳細（時刻・形式・メモ）が確認できます。</Step>
        <Tip>ダッシュボード（ホーム）でも今週の授業と期限が一目で確認できます。</Tip>
      </Section>

      <Section title="📖 教材を確認する">
        <p>先生に登録してもらった教材の一覧を「教材」メニューから確認できます（PC・タブレットのサイドバーから開けます）。</p>
      </Section>

      <Section title="🌲 学習の森">
        <div className="space-y-1.5">
          <p>宿題が承認されたりテストで好成績を取ると、森にアイテムが1つ育ちます。</p>
          <p>• <strong>竹</strong>：満点 / 偏差値70以上で出現する超レアアイテム</p>
          <p>• <strong>桜</strong>：90%以上 / 偏差値65以上で出現するレアアイテム</p>
          <p>• <strong>大木</strong>：宿題が5件承認されるごとに出現する記念アイテム</p>
          <p>• <strong>木</strong>：80〜89% / 偏差値60〜64で出現</p>
          <p>• <strong>茂み</strong>：60〜79% / 偏差値50〜59で出現</p>
          <p>• <strong>花・きのこ</strong>：宿題承認時にランダムで出現</p>
          <p>• 期限切れ・差し戻しの宿題があると古い植物が枯れますが、提出すると回復します</p>
          <p>• 64個育て終わると次の世代の森が始まります</p>
        </div>
      </Section>

      <Section title="🔔 LINE通知を設定する（生徒）">
        <Step n={1}>「設定」メニューを開き、「LINE連携を開始する」をタップします。</Step>
        <Step n={2}>6桁のコードが表示されたら、QRコードまたはリンクから katekyo の LINE 公式アカウントを友だち追加します。</Step>
        <Step n={3}>LINE のトーク画面に6桁のコードを送信すると連携完了です。</Step>
        <Tip>連携すると、宿題の承認・差し戻し時や、毎朝8時に期限が近い宿題のリマインダーが LINE に届きます。通知から宿題のページに直接移動できます。</Tip>
      </Section>

      <Section title="ログアウト・パスワード変更">
        <p>画面右上のアイコンからプロフィール編集（名前・パスワード変更）・ログアウトができます。パスワードを忘れた場合は先生に連絡してください。</p>
      </Section>
    </div>
  )
}

function AboutSection() {
  return (
    <div className="max-w-2xl">
      <div className="rounded-lg border bg-white p-5 space-y-3 text-sm text-gray-600">
        <p className="font-semibold text-gray-800">katekyo について</p>
        <p>家庭教師と生徒の学習をサポートするWebアプリです。宿題・成績・授業スケジュールを一元管理し、学習の継続を「学習の森」として可視化します。</p>
        <div className="pt-1 space-y-1 text-xs text-muted-foreground border-t">
          <p>開発者：植木敬太郎</p>
          <p>連絡先：ueki.keitaro@gmail.com</p>
          <p>バージョン：2026年5月</p>
          <p>技術スタック：Next.js 16 · Prisma · Supabase · Tailwind CSS</p>
        </div>
      </div>
    </div>
  )
}
