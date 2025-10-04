import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../supabaseClient";

interface Profile {
  id: string;
  name?: string;
  phone_number?: string;
  kakao_nickname?: string;
  kakao_id?: number;
  is_profile_completed: boolean;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    checkUser();
  }, [navigate]);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);

      // 프로필 정보 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
      } else if (profileData) {
        setProfile(profileData);
        setName(profileData.name || '');
        setPhoneNumber(profileData.phone_number || '');
      }

      // 프로필이 없는 경우 기본 이름 설정
      if (!profileData) {
        const defaultName = session.user.user_metadata?.nickname || 'User';
        setName(defaultName);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
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

    if (!user) return;

    try {
      setUpdating(true);

      const profileData = {
        id: user.id,
        name: name.trim(),
        phone_number: phoneNumber.trim(),
        kakao_nickname: user.user_metadata?.nickname,
        kakao_id: user.user_metadata?.provider_id ? 
          parseInt(user.user_metadata.provider_id) : 
          profile?.kakao_id,
        is_profile_completed: true
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (error) {
        console.error('Update profile error:', error);
        toast({
          title: "오류",
          description: "프로필 업데이트 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } else {
        setProfile(prev => ({ ...prev, ...profileData }));
        toast({
          title: "프로필 업데이트",
          description: "프로필이 성공적으로 업데이트되었습니다.",
        });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast({
        title: "오류",
        description: "프로필 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        toast({
          title: "오류",
          description: "로그아웃 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "로그아웃",
          description: "로그아웃되었습니다.",
        });
        navigate("/auth");
      }
    } catch (error) {
      console.error('Logout error:', error);
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

  const kakaoNickname = profile?.kakao_nickname || user.user_metadata?.nickname;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          돌아가기
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>마이페이지</CardTitle>
            <CardDescription>프로필 정보를 관리하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 프로필 아바타 */}
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-lg">
                  {name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
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
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="010-1234-5678"
                />
              </div>

              {user.user_metadata?.provider === 'kakao' && (
                <div className="space-y-2">
                  <Label>로그인 방식</Label>
                  <div className="flex items-center space-x-2">
                    <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-sm font-semibold">
                      카카오 로그인
                    </div>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={updating} className="w-full">
                {updating ? "업데이트 중..." : "프로필 업데이트"}
              </Button>
            </form>

            <div className="pt-4 border-t">
              <Button variant="destructive" onClick={handleLogout} className="w-full">
                로그아웃
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
