import { useState } from 'react'
import Form from './Form'
import Note from './Note'

function Main() {
  const [count, setCount] = useState(1)

  const add = () => {
    setCount(count + 1)
  }

  const send = () => {
    return false
  }

  return (
    <main className="main max-w-3xl mb-24 mx-auto px-6">
      <h2 className="mt-6 mb-12 text-xl md:text-2xl text-center">国見地区空き家マッチングツアー
        <br />イベント保険加入申込フォーム</h2>
      <p className="max-w-xl mx-auto text-sm md:text-base">この度はお問い合わせありがとうございました。
        <br />イベント保険加入のため、氏名、住所、生年月日をお聞きしています。
        <br />当フォームでのお申込み完了をもって、ツアー参加受付を完了といたします。
      </p>
      {Array.from({ length: count }).map((_, i) => (
        <Form index={i + 1} />
      ))}
      <button className="block mx-auto button is-medium is-orange" onClick={add}>参加者を追加</button>
      <Note />
      <button className="block mx-auto button is-medium is-sky" onClick={send}>送信</button>
    </main>
  )
}

export default Main
