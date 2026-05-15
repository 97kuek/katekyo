"use client"

import { useActionState } from "react"
import { updateName } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function NameForm({ currentName }: { currentName: string }) {
  const [state, action, isPending] = useActionState(updateName, { error: "" })

  return (
    <form action={action} className="space-y-3">
      {state.error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{state.error}</p>}
      {state.success && <p className="text-sm text-green-700 bg-green-50 p-2 rounded">{state.success}</p>}
      <div className="space-y-1.5">
        <Label htmlFor="name">名前</Label>
        <Input id="name" name="name" required defaultValue={currentName} maxLength={50} />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "保存中..." : "保存"}
      </Button>
    </form>
  )
}
