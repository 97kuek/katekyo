import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "プライバシーポリシー | katekyo",
}

export default function PrivacyPage() {
  return (
    <article className="prose prose-sm prose-gray max-w-none">
      <h1 className="text-2xl font-bold mb-1">プライバシーポリシー</h1>
      <p className="text-xs text-gray-400 mb-8">最終更新: 2025年6月1日</p>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-2">収集する情報</h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-2">本サービスは以下の情報を収集・保存します。</p>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li>氏名・メールアドレス（アカウント管理のため）</li>
          <li>学年（生徒のみ）</li>
          <li>授業記録（日時・科目・ログ・料金）</li>
          <li>宿題・成績の記録</li>
          <li>宿題提出時の写真（任意）</li>
          <li>LINE通知設定（任意）</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-2">利用目的</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          収集した情報は、担当の先生と生徒の間での学習管理サービスの提供のみに使用します。第三者への販売・提供は行いません。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-2">利用する外部サービス</h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-2">サービス提供のため、以下の外部サービスを利用しています。</p>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li><strong>Supabase</strong> — データベース・ファイルストレージ</li>
          <li><strong>Vercel</strong> — アプリケーションのホスティング</li>
          <li><strong>LINE</strong> — 通知機能（ユーザーが設定した場合のみ）</li>
        </ul>
        <p className="text-sm text-gray-500 mt-2">
          各サービスのプライバシーポリシーは各社のサイトをご確認ください。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-2">データの保持期間</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          授業・成績・宿題・テスト予定のデータは、1学年分（前年度4月1日以前）を毎年4月に自動削除します。アカウント情報は退会申請があるまで保持します。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-2">データの削除</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          個人データの削除を希望される場合は、本サービス管理者までご連絡ください。速やかに対応します。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-2">Cookie・ローカルストレージ</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          本サービスはログイン状態を維持するためにセッションCookieを使用します。広告目的のトラッキングは行いません。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-2">お問い合わせ</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          プライバシーに関するお問い合わせは、本サービス管理者までご連絡ください。
        </p>
      </section>
    </article>
  )
}
