function Note() {
  return (
    <>
      <h4 className="mt-12 mb-6 text-lg">その他</h4>
      <table className="form">
        <tbody>
          <tr>
            <th><label>備考</label></th>
            <td><textarea name="備考"></textarea></td>
          </tr>
        </tbody>
      </table>
    </>
  )
}

export default Note
