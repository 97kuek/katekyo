import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "利用規約 | katekyo",
}

export default function TermsPage() {
  return (
    <article className="prose prose-sm max-w-none text-foreground">
      <h1 className="text-2xl font-bold mb-1">利用規約</h1>
      <p className="text-xs text-muted-foreground mb-8">最終更新: 2026年5月19日</p>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-2">第1条（本サービスについて）</h2>
        <p className="text-sm leading-relaxed">
          katekyo（以下「本サービス」）は、個人の家庭教師と生徒の間で宿題・成績・授業スケジュールを管理するためのウェブアプリケーションです。本サービスは招待制であり、家庭教師（以下「先生」）から招待を受けた利用者のみが使用できます。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-2">第2条（利用資格）</h2>
        <p className="text-sm leading-relaxed">
          本サービスは、先生から発行された招待リンクを通じてアカウントを作成した方のみ利用できます。招待リンクの有効期間は発行から7日間です。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-2">第3条（禁止事項）</h2>
        <p className="text-sm leading-relaxed mb-2">利用者は以下の行為を行ってはなりません。</p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>アカウントの第三者への貸与・譲渡・共有</li>
          <li>他の利用者のデータへの不正アクセス</li>
          <li>本サービスのサーバーやネットワークへの過度な負荷をかける行為</li>
          <li>その他、法令または公序良俗に反する行為</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-2">第4条（データの管理責任）</h2>
        <p className="text-sm leading-relaxed">
          先生は、担当する生徒の個人情報を本サービスに登録することに対して責任を負います。生徒（保護者を含む）から同意を得た上でご利用ください。登録した情報は適切に管理し、目的外の使用はお控えください。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-2">第5条（免責事項）</h2>
        <p className="text-sm leading-relaxed">
          本サービスは現状有姿で提供されます。サービスの中断・障害・データの損失等によって生じた損害について、運営者は一切の責任を負いません。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-2">第6条（利用規約の変更）</h2>
        <p className="text-sm leading-relaxed">
          本規約は予告なく変更される場合があります。変更後も引き続き本サービスをご利用の場合は、変更後の規約に同意したものとみなします。
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold mb-2">第7条（お問い合わせ）</h2>
        <p className="text-sm leading-relaxed">
          本規約に関するお問い合わせは <a href="mailto:ueki.keitaro@gmail.com" className="text-primary underline">ueki.keitaro@gmail.com</a> までご連絡ください。
        </p>
      </section>
    </article>
  )
}
