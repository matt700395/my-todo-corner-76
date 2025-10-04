import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "../../supabaseClient";

const Signup = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkUserAndProfile();
  }, [navigate]);

  const checkUserAndProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // 프로필 완성 여부 확인
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
      } else if (profileData && profileData.is_profile_completed) {
        // 이미 프로필이 완성된 경우 메인 페이지로
        navigate("/");
        return;
      }

    } catch (error) {
      console.error('Auth check error:', error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "오류",
        description: "이름을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!phoneNumber.trim()) {
      toast({
        title: "오류", 
        description: "전화번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 전화번호 형식 검증 (간단한 검증)
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phoneNumber.replace(/[^0-9]/g, ''))) {
      toast({
        title: "오류",
        description: "올바른 전화번호 형식을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          phone_number: phoneNumber.trim(),
          is_profile_completed: true
        })
        .eq('id', user.id);

      if (error) {
        console.error('Profile update error:', error);
        toast({
          title: "오류",
          description: "회원가입 정보 저장 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "회원가입 완료",
          description: "환영합니다! 이제 서비스를 이용하실 수 있습니다.",
        });
        navigate("/");
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "오류",
        description: "회원가입 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const kakaoNickname = user.user_metadata?.nickname;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>회원가입</CardTitle>
          <CardDescription>
            추가 정보를 입력하여 회원가입을 완료하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {kakaoNickname && (
              <div className="space-y-2">
                <Label>카카오 닉네임</Label>
                <div className="flex items-center space-x-2">
                  <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-semibold">
                    {kakaoNickname}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="실명을 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">전화번호 *</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="010-1234-5678"
                required
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "가입 중..." : "회원가입 완료"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
