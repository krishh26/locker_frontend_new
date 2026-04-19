"use client"

import { useEffect } from "react"

import { mapUserApiToAuthUser } from "@/lib/auth/map-user-api-to-auth-user"
import { useGetLearnerDetailsQuery } from "@/store/api/learner/learnerApi"
import { useGetUserQuery } from "@/store/api/user/userApi"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  selectAuthToken,
  selectAuthUser,
  setLearnerData,
  updateUser,
} from "@/store/slices/authSlice"

/**
 * On dashboard mount, refreshes Redux like post-login:
 * - Learners: only `/learner/get/:id` (same as login; no `/user/get`).
 * - Other roles: only `/user/get`.
 */
export function DashboardUserSync() {
  const dispatch = useAppDispatch()
  const token = useAppSelector(selectAuthToken)
  const user = useAppSelector(selectAuthUser)

  const hasSession = Boolean(token && user)
  const isLearner = user?.role === "Learner"
  const skipGetUser = !hasSession || isLearner

  const {
    data: userResponse,
    isSuccess: userQuerySuccess,
    isError: userQueryError,
    error: userError,
  } = useGetUserQuery(undefined, {
    skip: skipGetUser,
    refetchOnMountOrArgChange: true,
  })
  const rawLearnerId = user?.learner_id
  const learnerIdNum =
    rawLearnerId !== undefined && rawLearnerId !== null && `${rawLearnerId}` !== ""
      ? Number(rawLearnerId)
      : NaN
  const canFetchLearner =
    hasSession && isLearner && Number.isFinite(learnerIdNum) && learnerIdNum > 0

  const {
    data: learnerResponse,
    isSuccess: learnerQuerySuccess,
    isError: learnerQueryError,
    error: learnerError,
  } = useGetLearnerDetailsQuery(learnerIdNum, {
    skip: !canFetchLearner,
    refetchOnMountOrArgChange: true,
  })

  useEffect(() => {
    if (!userQuerySuccess || !userResponse?.data) {
      return
    }
    dispatch(updateUser(mapUserApiToAuthUser(userResponse.data)))
  }, [dispatch, userQuerySuccess, userResponse?.data])

  useEffect(() => {
    if (!learnerQuerySuccess || !learnerResponse?.data) {
      return
    }
    dispatch(
      setLearnerData({
        ...learnerResponse.data,
        role: "Learner",
      })
    )
  }, [dispatch, learnerQuerySuccess, learnerResponse?.data])

  useEffect(() => {
    if (userQueryError) {
      console.error("DashboardUserSync: getUser failed", userError)
    }
  }, [userQueryError, userError])

  useEffect(() => {
    if (learnerQueryError) {
      console.error("DashboardUserSync: getLearnerDetails failed", learnerError)
    }
  }, [learnerQueryError, learnerError])

  return null
}
