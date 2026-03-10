import { RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useTranslations } from 'next-intl'
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
  isReadOnly?: boolean
}

export function EvidenceLinksTable({
  evidenceList,
  isLoadingEvidence,
  unitCode,
  onRefresh,
  isReadOnly = false,
}: EvidenceLinksTableProps) {
  const t = useTranslations('qaSamplePlan.editSampleModal.evidenceLinksTable')
  return (
    <div className='flex-1'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold'>{t('title')}</h3>
        <div className='flex gap-2'>
          <Button
            variant='ghost'
            size='sm'
            onClick={onRefresh}
            disabled={isLoadingEvidence || !unitCode || isReadOnly}
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
                <TableHead>{t('columns.examinedEvidence')}</TableHead>
                <TableHead>{t('columns.assessmentMethodsUsed')}</TableHead>
                <TableHead>{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingEvidence ? (
                <TableRow>
                  <TableCell colSpan={3} className='text-center py-8'>
                    <div className='flex items-center justify-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      <span className='text-sm text-muted-foreground'>{t('loading')}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : evidenceList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className='text-center py-8 text-muted-foreground'>
                    {t('empty')}
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
                          <span className='text-sm text-muted-foreground'>{t('na')}</span>
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

