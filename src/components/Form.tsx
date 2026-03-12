function Form({ index }: { index: number }) {
  return (
    <>
      <h4 className="mt-12 mb-6 text-lg">{`${index}人目の方の情報`}</h4>
      <table className="form">
        <tbody>
          <tr>
            <th><label>ご氏名{index === 1 && (<span className="required">*必須</span>)}</label></th>
            <td><input type="text" name={`ご氏名 (${index}人目)`} required /></td>
          </tr>
          <tr>
            <th><label>生年月日{index === 1 && (<span className="required">*必須</span>)}</label></th>
            <td>
              <select name={`年 (${index}人目)`}>
                {Array.from({ length: 100 }, (_, i) => {
                  const y = new Date().getFullYear() - i
                  return <option key={y} value={y}>{y}</option>
                })}
              </select>

              <select name={`月 (${index}人目)`}>
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}</option>
                ))}
              </select>

              <select name={`日 (${index}人目)`}>
                {[...Array(31)].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}</option>
                ))}
              </select>
            </td>
          </tr>
          <tr>
            <th><label>ご住所{index === 1 && (<span className="required">*必須</span>)}</label></th>
            <td><input type="address" name={`ご住所 (${index}人目)`} required /></td>
          </tr>
        </tbody>
      </table>
    </>
  )
}

export default Form
