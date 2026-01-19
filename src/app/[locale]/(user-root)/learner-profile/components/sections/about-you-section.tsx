"use client";

import { useRef, useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useUploadLearnerAvatarMutation } from "@/store/api/learner/learnerApi";
import { getRandomColor } from "@/app/[locale]/(learner-root)/forum/utils/randomColor";
import { toast } from "sonner";
import { Loader2, Camera } from "lucide-react";
import type { LearnerData } from "@/store/api/learner/types";

interface AboutYouSectionProps {
  learner: LearnerData;
  canEdit?: boolean;
}

export function AboutYouSection({ learner, canEdit = false }: AboutYouSectionProps) {
  const form = useFormContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadAvatar, { isLoading: isUploading }] = useUploadLearnerAvatarMutation();

  const avatarUrl = previewImage || learner.avatar?.url || null;
  const avatarColor = getRandomColor(learner.user_name?.toLowerCase().charAt(0));
  const initials = `${learner.first_name?.charAt(0) || ""}${
    learner.last_name?.charAt(0) || ""
  }`.toUpperCase();

  // Clear preview when learner data updates (after successful upload)
  useEffect(() => {
    if (learner.avatar?.url && previewImage) {
      // If we have a new avatar URL from the server, clear the preview
      setPreviewImage(null);
    }
  }, [learner.avatar?.url, previewImage]);

  const handleAvatarClick = () => {
    if (canEdit && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }

      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      // Show preview
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);

      try {
        await uploadAvatar({
          learnerId: learner.learner_id,
          file,
        }).unwrap();
        toast.success("Avatar uploaded successfully");
      } catch (error) {
        console.error("Failed to upload avatar:", error);
        toast.error("Failed to upload avatar. Please try again.");
        setPreviewImage(null);
      }
    }
  };

  const formatDate = (date: string | undefined | null): string => {
    if (!date) return "-";
    try {
      const d = new Date(date);
      return d.toLocaleDateString();
    } catch {
      return date;
    }
  };

  const firstName = learner.first_name || "-";
  const lastName = learner.last_name || "-";
  const userName = learner.user_name || "-";
  const email = learner.email || "-";
  const telephone = (learner as { telephone?: string }).telephone || "-";
  const mobile = learner.mobile || "-";
  const dob = formatDate((learner as { dob?: string }).dob);
  const gender = (learner as { gender?: string }).gender || "-";
  const nationalInsNo = learner.national_ins_no || "-";
  const ethnicity = (learner as { ethnicity?: string }).ethnicity || "-";
  const learnerDisability = (learner as { learner_disability?: string }).learner_disability || "-";
  const learnerDifficulty = (learner as { learner_difficulity?: string }).learner_difficulity || "-";
  const initialAssessmentNumeracy = (learner as { Initial_Assessment_Numeracy?: string }).Initial_Assessment_Numeracy || "-";
  const initialAssessmentLiteracy = (learner as { Initial_Assessment_Literacy?: string }).Initial_Assessment_Literacy || "-";
  const initialAssessmentICT = (learner as { Initial_Assessment_ICT?: string }).Initial_Assessment_ICT || "-";

  return (
    <Card>
      <CardHeader>
        <CardTitle>About You</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Photo Upload Section */}
        <div className="flex flex-col items-center justify-center py-4">
          <div className="relative">
            <Avatar
              className={`h-[150px] w-[150px] border-2 border-border cursor-pointer transition-opacity hover:opacity-80 ${
                canEdit ? "" : "cursor-default"
              } ${isUploading ? "opacity-50" : ""}`}
              onClick={handleAvatarClick}
              style={{
                backgroundColor: avatarUrl ? "transparent" : avatarColor,
                borderRadius: "0",
              }}
            >
              {avatarUrl && (
                <AvatarImage
                  src={avatarUrl}
                  alt={`${learner.first_name} ${learner.last_name}`}
                  className="object-cover"
                />
              )}
              <AvatarFallback
                className="text-4xl font-semibold text-white"
                style={{ backgroundColor: avatarColor }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            {canEdit && (
              <>
                <div className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-md cursor-pointer hover:bg-primary/90 transition-colors">
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={isUploading}
                />
              </>
            )}
          </div>
          {canEdit && (
            <p className="mt-2 text-sm text-muted-foreground text-center">
              Click to upload photo
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">First Name</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("first_name")}
                  className="min-h-10"
                />
                {form.formState.errors.first_name && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.first_name.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {firstName}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Last Name</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("last_name")}
                  className="min-h-10"
                />
                {form.formState.errors.last_name && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.last_name.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {lastName}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Username</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("user_name")}
                  className="min-h-10"
                />
                {form.formState.errors.user_name && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.user_name.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {userName}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Email</Label>
            {canEdit ? (
              <>
                <Input
                  type="email"
                  {...form.register("email")}
                  className="min-h-10"
                />
                {form.formState.errors.email && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.email.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {email}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Telephone</Label>
            {canEdit ? (
              <>
                <Input
                  type="tel"
                  {...form.register("telephone")}
                  className="min-h-10"
                />
                {form.formState.errors.telephone && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.telephone.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {telephone}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Mobile</Label>
            {canEdit ? (
              <>
                <Input
                  type="tel"
                  {...form.register("mobile")}
                  className="min-h-10"
                />
                {form.formState.errors.mobile && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.mobile.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {mobile}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date of Birth</Label>
            {canEdit ? (
              <>
                <Input
                  type="date"
                  {...form.register("dob")}
                  className="min-h-10"
                />
                {form.formState.errors.dob && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.dob.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {dob}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Gender</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("gender")}
                  className="min-h-10"
                />
                {form.formState.errors.gender && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.gender.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {gender}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">National Insurance No</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("national_ins_no")}
                  className="min-h-10"
                />
                {form.formState.errors.national_ins_no && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.national_ins_no.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {nationalInsNo}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ethnicity</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("ethnicity")}
                  className="min-h-10"
                />
                {form.formState.errors.ethnicity && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.ethnicity.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {ethnicity}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Learner Disability</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("learner_disability")}
                  className="min-h-10"
                />
                {form.formState.errors.learner_disability && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.learner_disability.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {learnerDisability}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Learning Difficulties</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("learner_difficulity")}
                  className="min-h-10"
                />
                {form.formState.errors.learner_difficulity && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.learner_difficulity.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {learnerDifficulty}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Initial Assessment Numeracy</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("Initial_Assessment_Numeracy")}
                  className="min-h-10"
                />
                {form.formState.errors.Initial_Assessment_Numeracy && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.Initial_Assessment_Numeracy.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {initialAssessmentNumeracy}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Initial Assessment Literacy</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("Initial_Assessment_Literacy")}
                  className="min-h-10"
                />
                {form.formState.errors.Initial_Assessment_Literacy && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.Initial_Assessment_Literacy.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {initialAssessmentLiteracy}
              </div>
            )}
          </div>
        </div>

        {initialAssessmentICT && initialAssessmentICT !== "-" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Initial Assessment ICT</Label>
              {canEdit ? (
                <>
                  <Input
                    type="text"
                    {...form.register("Initial_Assessment_ICT")}
                    className="min-h-10"
                  />
                  {form.formState.errors.Initial_Assessment_ICT && (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.Initial_Assessment_ICT.message as string}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center">
                  {initialAssessmentICT}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

