import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../supabaseClient";

interface Profile {
  id: string;
  name?: string;
  phone_number?: string;
  school?: string;
  department?: string;
  student_id?: string;
  national_id?: string;
  is_profile_completed: boolean;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [school, setSchool] = useState("");
  const [department, setDepartment] = useState("");
  const [studentId, setStudentId] = useState("");
  const [nationalId, setNationalId] = useState("");
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
        setSchool(profileData.school || '');
        setDepartment(profileData.department || '');
        setStudentId(profileData.student_id || '');
        setNationalId(profileData.national_id || '');
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

    if (!school.trim()) {
      toast({
        title: "오류",
        description: "학교를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!department.trim()) {
      toast({
        title: "오류",
        description: "학과를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!studentId.trim()) {
      toast({
        title: "오류",
        description: "학번을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!nationalId.trim()) {
      toast({
        title: "오류",
        description: "주민등록번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!user) return;

    try {
      setUpdating(true);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: name.trim(),
          phone_number: phoneNumber.trim(),
          school: school.trim(),
          department: department.trim(),
          student_id: studentId.trim(),
          national_id: nationalId.trim(),
          is_profile_completed: true
        });

      if (error) {
        console.error('Update profile error:', error);
        toast({
          title: "오류",
          description: "프로필 업데이트 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } else {
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="school">학교</Label>
                  <Input
                    id="school"
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="대학교명"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">학과</Label>
                  <Input
                    id="department"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="학과명"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentId">학번</Label>
                  <Input
                    id="studentId"
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="학번"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationalId">주민등록번호</Label>
                  <Input
                    id="nationalId"
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="123456-1234567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>이메일</Label>
                <Input 
                  value={user.email || ''} 
                  disabled 
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  계정 이메일 (수정 불가)
                </p>
              </div>

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