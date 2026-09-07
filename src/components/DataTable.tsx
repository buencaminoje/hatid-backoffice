import type { ReactNode } from "react";
export function DataTable({ columns, rows, render }: { columns: string[]; rows: any[]; render: (row:any)=>ReactNode[] }) {
  return <div className="table-wrap"><table><thead><tr>{columns.map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>
    {rows.length ? rows.map((row,i)=><tr key={row.id ?? i}>{render(row).map((cell,j)=><td key={j}>{cell}</td>)}</tr>) : <tr><td colSpan={columns.length} className="empty">No records found</td></tr>}
  </tbody></table></div>;
}
