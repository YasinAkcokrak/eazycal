"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Suspense } from "react"
import Image from "next/image"

interface Log {
  id: string
  name: string
  calories: number
  confidence: string | null
  imageUrl: string | null
  createdAt: string
  user: { id: string; name: string | null; email: string }
}

function LogsTable() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [logs, setLogs] = useState<Log[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)

  const page = Number(searchParams.get("page") ?? 1)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/scan-logs?page=${page}`)
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs ?? [])
        setTotal(d.total ?? 0)
        setPages(d.pages ?? 1)
      })
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{total} scan logs</p>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Meal</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Calories</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {log.imageUrl ? (
                      <div className="relative h-10 w-10 rounded overflow-hidden">
                        <Image src={log.imageUrl} alt={log.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{log.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {log.user.name?.[0]?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{log.user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{log.calories} kcal</TableCell>
                  <TableCell>
                    {log.confidence ? (
                      <Badge
                        variant="secondary"
                        className={
                          log.confidence === "HIGH"
                            ? "bg-green-100 text-green-800"
                            : log.confidence === "MEDIUM"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {log.confidence}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => router.push(`/admin/scan-logs?page=${page - 1}`)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => router.push(`/admin/scan-logs?page=${page + 1}`)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default function ScanLogsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Scan Logs</h1>
      <Card>
        <CardHeader>
          <CardTitle>AI Scan History</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p>Loading...</p>}>
            <LogsTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
