import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserProfileSchema, changePasswordSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, X, Camera } from "lucide-react";
import type { z } from "zod";

type ProfileFormData = z.infer<typeof updateUserProfileSchema>;
type PasswordFormData = z.infer<typeof changePasswordSchema>;

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileModal({ open, onOpenChange }: ProfileModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(updateUserProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
      });
    }
  }, [user, profileForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      await apiRequest("PUT", "/api/user/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      await apiRequest("POST", "/api/user/change-password", data);
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao alterar senha",
        variant: "destructive",
      });
    },
  });

  const onSubmitProfile = async (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-betconta-secondary border-betconta-accent p-4">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg sm:text-2xl font-bold text-white">Meu Perfil</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-betconta-accent">
            <TabsTrigger value="profile" className="text-white text-sm data-[state=active]:bg-betconta-primary">
              Perfil
            </TabsTrigger>
            <TabsTrigger value="security" className="text-white text-sm data-[state=active]:bg-betconta-primary">
              Segurança
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            {/* Profile Picture */}
            <div className="text-center">
              <Avatar className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-3">
                <AvatarImage src={user.profileImageUrl || ""} />
                <AvatarFallback className="bg-betconta-primary text-white text-xl sm:text-3xl">
                  {user.firstName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                className="border-betconta-primary text-betconta-primary hover:bg-betconta-primary hover:text-white text-xs sm:text-sm"
              >
                <Camera className="mr-1 w-3 h-3 sm:w-4 sm:h-4" />
                Alterar foto
              </Button>
            </div>

            {/* Personal Information */}
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={profileForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 text-sm">Nome</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-betconta-accent border-gray-600 text-white focus:border-betconta-primary text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 text-sm">Sobrenome</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-betconta-accent border-gray-600 text-white focus:border-betconta-primary text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 text-sm">E-mail</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            className="bg-betconta-accent border-gray-600 text-white focus:border-betconta-primary text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 text-sm">Telefone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="(11) 99999-9999"
                            className="bg-betconta-accent border-gray-600 text-white focus:border-betconta-primary text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={profileForm.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300 text-sm">Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            className="bg-betconta-accent border-gray-600 text-white focus:border-betconta-primary text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <FormLabel className="text-gray-300 text-sm">CPF</FormLabel>
                    <Input
                      value={user.cpf || "Não informado"}
                      readOnly
                      className="bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="w-full bg-betconta-primary hover:bg-green-500 text-white text-sm sm:text-base"
                >
                  <Save className="mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                  {updateProfileMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </Form>
          </TabsContent>



          <TabsContent value="security" className="space-y-4">
            <Card className="bg-betconta-accent border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base sm:text-lg">Alterar Senha</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-3">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300 text-sm">Senha Atual</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="••••••••"
                              className="bg-betconta-secondary border-gray-600 text-white focus:border-betconta-primary text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 text-sm">Nova Senha</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder="••••••••"
                                className="bg-betconta-secondary border-gray-600 text-white focus:border-betconta-primary text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-300 text-sm">Confirmar Nova Senha</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder="••••••••"
                                className="bg-betconta-secondary border-gray-600 text-white focus:border-betconta-primary text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="w-full bg-betconta-primary hover:bg-green-500 text-white text-sm sm:text-base"
                    >
                      <Save className="mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                      {changePasswordMutation.isPending ? "Alterando..." : "Alterar Senha"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
