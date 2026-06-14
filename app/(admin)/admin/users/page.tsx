"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Suspense } from "react"

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  role: string
  isActive: boolean
  createdAt: string
  _count: { meals: number }
}

function UsersTable() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  const page = Number(searchParams.get("page") ?? 1)
  const search = searchParams.get("search") ?? ""

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/users?page=${page}&search=${encodeURIComponent(search)}`)
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users ?? [])
        setTotal(d.total ?? 0)
        setPages(d.pages ?? 1)
      })
      .finally(() => setLoading(false))
  }, [page, search])

  function setSearch(s: string) {
    router.push(`/admin/users?search=${encodeURIComponent(s)}&page=1`)
  }

  function setPage(p: number) {
    router.push(`/admin/users?search=${encodeURIComponent(search)}&page=${p}`)
  }

  async function toggleUser(id: string, isActive: boolean) {
    setToggling(id)
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    })
    setToggling(null)
    if (res.ok) {
      toast.success(`User ${isActive ? "disabled" : "enabled"}`)
      setUsers((u) => u.map((x) => (x.id === id ? { ...x, isActive: !isActive } : x)))
    } else {
      toast.error("Failed to update user")
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or email..."
          defaultValue={search}
          onChange={(e) => {
            const v = e.target.value
            const t = setTimeout(() => setSearch(v), 400)
            return () => clearTimeout(t)
          }}
        />
      </div>

      <p className="text-sm text-muted-foreground">{total} users found</p>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Meals</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.image ?? ""} />
                        <AvatarFallback>{u.name?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{u.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge>
                  </TableCell>
                  <TableCell>{u._count.meals}</TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? "default" : "destructive"}>
                      {u.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/admin/users/${u.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                        View
                      </Link>
                      <Button
                        variant={u.isActive ? "destructive" : "default"}
                        size="sm"
                        disabled={toggling === u.id}
                        onClick={() => toggleUser(u.id, u.isActive)}
                      >
                        {u.isActive ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p>Loading...</p>}>
            <UsersTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
