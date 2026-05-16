export default function ValidationErrors({ errors = [] }) {
  if (!errors.length) return null

  return (
    <section className="rounded-xl border border-ember/40 bg-ember/10 p-5">
      <p className="eyebrow text-ember">Validation</p>
      <h3 className="mt-1 text-xl font-normal">Field-level issues</h3>
      <div className="mt-4 overflow-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-ember/20">
              <th className="py-2 pr-4">Field</th>
              <th className="py-2 pr-4">Expected</th>
              <th className="py-2 pr-4">Received</th>
              <th className="py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((error, index) => (
              <tr key={`${error.field}-${index}`} className="border-b border-ember/10">
                <td className="py-2 pr-4 font-medium">{error.field}</td>
                <td className="py-2 pr-4">{error.expected}</td>
                <td className="py-2 pr-4">{JSON.stringify(error.received)}</td>
                <td className="py-2">{error.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
