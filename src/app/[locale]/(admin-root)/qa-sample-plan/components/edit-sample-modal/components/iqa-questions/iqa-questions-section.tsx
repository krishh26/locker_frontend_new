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
import type { SampleQuestion } from '@/store/api/qa-sample-plan/types'
import { IqaQuestionRow } from './iqa-question-row'

interface IqaQuestionsSectionProps {
  sampleQuestions: SampleQuestion[]
  onAnswerChange: (id: string, answer: 'Yes' | 'No') => void
  onDeleteQuestion: (id: string) => void
  onSaveQuestions: () => void
  isReadOnly?: boolean
}

export function IqaQuestionsSection({
  sampleQuestions,
  onAnswerChange,
  onDeleteQuestion,
  onSaveQuestions,
  isReadOnly = false,
}: IqaQuestionsSectionProps) {
  const t = useTranslations('qaSamplePlan.editSampleModal.iqaQuestions')
  return (
    <div className='mt-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-destructive'>{t('title')}</h3>
        <Button
          onClick={onSaveQuestions}
          className='bg-accent hover:bg-accent/90'
          size='sm'
          disabled={isReadOnly}
        >
          {t('save')}
        </Button>
      </div>
      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[60%]'>{t('columns.question')}</TableHead>
                <TableHead className='w-[15%] text-center'>{t('columns.yes')}</TableHead>
                <TableHead className='w-[15%] text-center'>{t('columns.no')}</TableHead>
                <TableHead className='w-[10%] text-center'>{t('columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleQuestions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className='text-center py-8 text-muted-foreground'>
                    {t('empty')}
                  </TableCell>
                </TableRow>
              ) : (
                sampleQuestions.map((question) => (
                  <IqaQuestionRow
                    key={question.id}
                    question={question}
                    onAnswerChange={onAnswerChange}
                    onDeleteQuestion={onDeleteQuestion}
                    isReadOnly={isReadOnly}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

