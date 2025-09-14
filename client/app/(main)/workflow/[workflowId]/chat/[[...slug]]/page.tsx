'use client'

export default function ChatPage({
  params,
}: {
  params: { workflowId: string; slug?: string[] }
}) {
  return (
    <div>
      <p>Workflow ID: {params.workflowId}</p>
      <p>Slug: {params.slug}</p>
    </div>
  )
}
