const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-4 bg-slate-200 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default TableSkeleton;
