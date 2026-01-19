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
import type { SampleQuestion } from '@/store/api/qa-sample-plan/types'
import { IqaQuestionRow } from './iqa-question-row'

interface IqaQuestionsSectionProps {
  sampleQuestions: SampleQuestion[]
  onAnswerChange: (id: string, answer: 'Yes' | 'No') => void
  onDeleteQuestion: (id: string) => void
  onSaveQuestions: () => void
}

export function IqaQuestionsSection({
  sampleQuestions,
  onAnswerChange,
  onDeleteQuestion,
  onSaveQuestions,
}: IqaQuestionsSectionProps) {
  return (
    <div className='mt-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-[#e91e63]'>IQA Questions</h3>
        <Button
          onClick={onSaveQuestions}
          className='bg-green-600 hover:bg-green-700'
          size='sm'
        >
          Save
        </Button>
      </div>
      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[60%]'>Question</TableHead>
                <TableHead className='w-[15%] text-center'>Yes</TableHead>
                <TableHead className='w-[15%] text-center'>No</TableHead>
                <TableHead className='w-[10%] text-center'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sampleQuestions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className='text-center py-8 text-muted-foreground'>
                    No IQA questions available for this sample.
                  </TableCell>
                </TableRow>
              ) : (
                sampleQuestions.map((question) => (
                  <IqaQuestionRow
                    key={question.id}
                    question={question}
                    onAnswerChange={onAnswerChange}
                    onDeleteQuestion={onDeleteQuestion}
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

