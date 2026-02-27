import { combineReducers, Middleware } from '@reduxjs/toolkit'
import { cacheSyncMiddleware } from '@/store/middleware/cacheSyncMiddleware'

// Import all API here
import { authApi } from "@/store/api/auth/authApi"
import { cpdApi } from "@/store/api/cpd/cpdApi"
import { forumApi } from "@/store/api/forum/forumApi"
import { skillsScanApi } from "@/store/api/skills-scan/skillsScanApi"
import { learnerApi } from "@/store/api/learner/learnerApi"
import { formsApi } from "@/store/api/forms/formsApi"
import { innovationsApi } from "@/store/api/innovations/innovationsApi"
import { supportApi } from "@/store/api/support/supportApi"
import { resourcesApi } from "@/store/api/resources/resourcesApi"
import { healthWellbeingApi } from "@/store/api/health-wellbeing/healthWellbeingApi"
import { supplementaryTrainingApi } from "@/store/api/supplementary-training/supplementaryTrainingApi"
import { timeLogApi } from "@/store/api/time-log/timeLogApi"
import { documentsToSignApi } from "@/store/api/documents-to-sign/documentsToSignApi"
import { evidenceApi } from "@/store/api/evidence/evidenceApi"
import { learnerPlanApi } from "@/store/api/learner-plan/learnerPlanApi"
import { surveyApi } from "@/store/api/survey/surveyApi"
import { unitsApi } from "@/store/api/units/unitsApi"
import { dashboardApi } from "@/store/api/dashboard/dashboardApi"
import { sessionApi } from "@/store/api/session/sessionApi"
import { userApi } from "@/store/api/user/userApi"
import { employerApi } from "@/store/api/employer/employerApi"
import { broadcastApi } from "@/store/api/broadcast/broadcastApi"
import { courseApi } from "@/store/api/course/courseApi"
import { fundingBandApi } from "@/store/api/funding-band/fundingBandApi"
import { trainerRiskRatingApi } from "@/store/api/trainer-risk-rating/trainerRiskRatingApi"
import { qaSamplePlanApi } from "@/store/api/qa-sample-plan/qaSamplePlanApi"
import { caseloadApi } from "@/store/api/caseload/caseloadApi"
import { safeguardingApi } from "@/store/api/safeguarding/safeguardingApi"
import { acknowledgementApi } from "@/store/api/acknowledgement/acknowledgementApi"
import { defaultReviewWeeksApi } from "@/store/api/default-review-weeks/defaultReviewWeeksApi"
import { iqaQuestionsApi } from "@/store/api/iqa-questions/iqaQuestionsApi"
import { sessionTypeApi } from "@/store/api/session-type/sessionTypeApi"
import { awaitingSignatureApi } from "@/store/api/awaiting-signature/awaitingSignatureApi"
import { progressExclusionApi } from "@/store/api/progress-exclusion/progressExclusionApi"
import { notificationApi } from "@/store/api/notification/notificationApi"
import { contractedWorkApi } from "@/store/api/contracted-work/contractedWorkApi"
import { moduleUnitProgressApi } from "@/store/api/module-unit-progress/moduleUnitProgressApi"
import { organisationApi } from "@/store/api/organisations/organisationApi"
import { centreApi } from "@/store/api/centres/centreApi"
import { paymentApi } from "@/store/api/payments/paymentApi"
import { subscriptionApi } from "@/store/api/subscriptions/subscriptionApi"
import { auditLogApi } from "@/store/api/audit-logs/auditLogApi"

import { accessControlApi } from "@/store/api/access-control/accessControlApi"
import { accountManagerApi } from "@/store/api/account-manager/accountManagerApi"
import { featureControlApi } from "@/store/api/feature-control/featureControlApi"
import { systemAdminApi } from "@/store/api/system-admin/systemAdminApi"


// Import all slices here
import authReducer from "@/store/slices/authSlice"
import skillsScanReducer from "@/store/slices/skillsScanSlice"
import surveyReducer from "@/store/slices/surveySlice"
import responseReducer from "@/store/slices/responseSlice"
import cacheReducer from "@/store/slices/cacheSlice"
import courseBuilderReducer from "@/store/slices/courseBuilderSlice"
import qaSamplePlanReducer from "@/store/slices/qaSamplePlanSlice"
import courseReducer from "@/store/slices/courseSlice"
import orgContextReducer from "@/store/slices/orgContextSlice"


// Root Reducer - Combine all slices here
export const rootReducer = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  [cpdApi.reducerPath]: cpdApi.reducer,
  [forumApi.reducerPath]: forumApi.reducer,
  [skillsScanApi.reducerPath]: skillsScanApi.reducer,
  [learnerApi.reducerPath]: learnerApi.reducer,
  [formsApi.reducerPath]: formsApi.reducer,
  [innovationsApi.reducerPath]: innovationsApi.reducer,
  [supportApi.reducerPath]: supportApi.reducer,
  [resourcesApi.reducerPath]: resourcesApi.reducer,
  [healthWellbeingApi.reducerPath]: healthWellbeingApi.reducer,
  [supplementaryTrainingApi.reducerPath]: supplementaryTrainingApi.reducer,
  [timeLogApi.reducerPath]: timeLogApi.reducer,
  [documentsToSignApi.reducerPath]: documentsToSignApi.reducer,
  [evidenceApi.reducerPath]: evidenceApi.reducer,
  [learnerPlanApi.reducerPath]: learnerPlanApi.reducer,
  [surveyApi.reducerPath]: surveyApi.reducer,
  [unitsApi.reducerPath]: unitsApi.reducer,
  [dashboardApi.reducerPath]: dashboardApi.reducer,
  [sessionApi.reducerPath]: sessionApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [employerApi.reducerPath]: employerApi.reducer,
  [broadcastApi.reducerPath]: broadcastApi.reducer,
  [courseApi.reducerPath]: courseApi.reducer,
  [fundingBandApi.reducerPath]: fundingBandApi.reducer,
  [trainerRiskRatingApi.reducerPath]: trainerRiskRatingApi.reducer,
  [qaSamplePlanApi.reducerPath]: qaSamplePlanApi.reducer,
  [caseloadApi.reducerPath]: caseloadApi.reducer,
  [safeguardingApi.reducerPath]: safeguardingApi.reducer,
  [acknowledgementApi.reducerPath]: acknowledgementApi.reducer,
  [defaultReviewWeeksApi.reducerPath]: defaultReviewWeeksApi.reducer,
  [iqaQuestionsApi.reducerPath]: iqaQuestionsApi.reducer,
  [sessionTypeApi.reducerPath]: sessionTypeApi.reducer,
  [awaitingSignatureApi.reducerPath]: awaitingSignatureApi.reducer,
    [progressExclusionApi.reducerPath]: progressExclusionApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [contractedWorkApi.reducerPath]: contractedWorkApi.reducer,
    [moduleUnitProgressApi.reducerPath]: moduleUnitProgressApi.reducer,
    [organisationApi.reducerPath]: organisationApi.reducer,
    [centreApi.reducerPath]: centreApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer,
    [subscriptionApi.reducerPath]: subscriptionApi.reducer,
    [auditLogApi.reducerPath]: auditLogApi.reducer,
    // New modules from CSV
    [accessControlApi.reducerPath]: accessControlApi.reducer,
    [accountManagerApi.reducerPath]: accountManagerApi.reducer,
    [featureControlApi.reducerPath]: featureControlApi.reducer,
    [systemAdminApi.reducerPath]: systemAdminApi.reducer,
    auth: authReducer,
  skillsScan: skillsScanReducer,
  survey: surveyReducer,
  response: responseReducer,
  cache: cacheReducer,
    courseBuilder: courseBuilderReducer,
    qaSamplePlan: qaSamplePlanReducer,
    course: courseReducer,
    orgContext: orgContextReducer,
})

// Middleware - Extend this array with necessary middleware
export const concatMiddleware: Middleware[] = [
  authApi.middleware,
  cpdApi.middleware,
  forumApi.middleware,
  skillsScanApi.middleware,
  learnerApi.middleware,
  formsApi.middleware,
  innovationsApi.middleware,
  supportApi.middleware,
  resourcesApi.middleware,
  healthWellbeingApi.middleware,
  supplementaryTrainingApi.middleware,
  timeLogApi.middleware,
  documentsToSignApi.middleware,
  evidenceApi.middleware,
  learnerPlanApi.middleware,
  surveyApi.middleware,
  unitsApi.middleware,
  dashboardApi.middleware,
  sessionApi.middleware,
  userApi.middleware,
  employerApi.middleware,
  broadcastApi.middleware,
  courseApi.middleware,
  fundingBandApi.middleware,
  trainerRiskRatingApi.middleware,
  qaSamplePlanApi.middleware,
  caseloadApi.middleware,
  safeguardingApi.middleware,
  acknowledgementApi.middleware,
  defaultReviewWeeksApi.middleware,
  iqaQuestionsApi.middleware,
  sessionTypeApi.middleware,
  awaitingSignatureApi.middleware,
  progressExclusionApi.middleware,
  notificationApi.middleware,
  contractedWorkApi.middleware,
  moduleUnitProgressApi.middleware,
  organisationApi.middleware,
  centreApi.middleware,
  paymentApi.middleware,
  subscriptionApi.middleware,
  auditLogApi.middleware,
  // New modules from CSV
  accessControlApi.middleware,
  accountManagerApi.middleware,
  featureControlApi.middleware,
  systemAdminApi.middleware,
  cacheSyncMiddleware,
]
