import { RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { EvidenceItem } from '@/store/api/qa-sample-plan/types'

interface EvidenceLinksTableProps {
  evidenceList: EvidenceItem[]
  isLoadingEvidence: boolean
  unitCode: string | null
  onRefresh: () => void
}

export function EvidenceLinksTable({
  evidenceList,
  isLoadingEvidence,
  unitCode,
  onRefresh,
}: EvidenceLinksTableProps) {
  return (
    <div className='flex-1'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold'>Evidence Links for Sample</h3>
        <div className='flex gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={onRefresh}
            disabled={isLoadingEvidence || !unitCode}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingEvidence ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Examined Evidence</TableHead>
                <TableHead>Assessment Methods Used</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingEvidence ? (
                <TableRow>
                  <TableCell colSpan={3} className='text-center py-8'>
                    <div className='flex items-center justify-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      <span className='text-sm text-muted-foreground'>Loading evidence...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : evidenceList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className='text-center py-8 text-muted-foreground'>
                    There are no Evidence Links on this Sample
                  </TableCell>
                </TableRow>
              ) : (
                evidenceList.map((evidence) => (
                  <TableRow key={evidence.assignment_id}>
                    <TableCell>
                      <div>
                        <p className='font-medium'>{evidence.title}</p>
                        {evidence.description && (
                          <p className='text-sm text-muted-foreground mt-1'>{evidence.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex flex-wrap gap-1'>
                        {Array.isArray(evidence.assessment_method) &&
                        evidence.assessment_method.length > 0 ? (
                          evidence.assessment_method.map((method, idx) => (
                            <span key={idx} className='text-xs bg-secondary px-2 py-1 rounded'>
                              {method}
                            </span>
                          ))
                        ) : (
                          <span className='text-sm text-muted-foreground'>N/A</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {/* Actions can be added here if needed */}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

