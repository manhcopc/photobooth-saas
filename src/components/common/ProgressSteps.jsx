const steps = ['Bắt đầu', 'Chụp', 'Chọn', 'Preview', 'Xong']

export function ProgressSteps({ active = 0 }) {
  return (
    <div className="flex items-center gap-2 px-5 py-4">
      {steps.map((step, index) => (
        <div className="flex flex-1 flex-col gap-1" key={step}>
          <div className={`h-2 rounded-full ${index <= active ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-purple-100'}`} />
          <span className="text-[10px] font-semibold text-slate-500">{step}</span>
        </div>
      ))}
    </div>
  )
}
