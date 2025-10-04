import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddTodoForm } from "@/components/AddTodoForm";
import { TodoItem } from "@/components/TodoItem";
import { toast } from "@/hooks/use-toast";
import { User } from "lucide-react";
import { supabase } from "../../supabaseClient";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  user_id: string;
  created_at?: string;
}

interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

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
      }

      // 할 일 목록 가져오기
      await fetchTodos(session.user.id);
    } catch (error) {
      console.error('Auth check error:', error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const fetchTodos = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Todos fetch error:', error);
        toast({
          title: "오류",
          description: "할 일 목록을 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } else {
        setTodos(data || []);
      }
    } catch (error) {
      console.error('Fetch todos error:', error);
    }
  };

  const handleAddTodo = async (title: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([
          {
            title,
            completed: false,
            user_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Add todo error:', error);
        toast({
          title: "오류",
          description: "할 일 추가 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } else {
        setTodos(prev => [data, ...prev]);
        toast({
          title: "할 일 추가됨",
          description: "새 할 일이 추가되었습니다.",
        });
      }
    } catch (error) {
      console.error('Add todo error:', error);
      toast({
        title: "오류",
        description: "할 일 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleToggleTodo = async (id: string) => {
    try {
      const todo = todos.find(t => t.id === id);
      if (!todo) return;

      const { error } = await supabase
        .from('todos')
        .update({ completed: !todo.completed })
        .eq('id', id);

      if (error) {
        console.error('Toggle todo error:', error);
        toast({
          title: "오류",
          description: "할 일 상태 변경 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } else {
        setTodos(prev => 
          prev.map(t => 
            t.id === id ? { ...t, completed: !t.completed } : t
          )
        );
      }
    } catch (error) {
      console.error('Toggle todo error:', error);
    }
  };

  const handleDeleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete todo error:', error);
        toast({
          title: "오류",
          description: "할 일 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } else {
        setTodos(prev => prev.filter(t => t.id !== id));
        toast({
          title: "할 일 삭제됨",
          description: "할 일이 삭제되었습니다.",
        });
      }
    } catch (error) {
      console.error('Delete todo error:', error);
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

  const displayName = profile?.name || user.user_metadata?.name || user.email;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Todo App</h1>
          <Button variant="outline" onClick={() => navigate("/profile")}>
            <User className="mr-2 h-4 w-4" />
            {displayName}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>할 일 목록</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddTodoForm onAdd={handleAddTodo} />
            
            <div className="space-y-2">
              {todos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  할 일이 없습니다. 새로운 할 일을 추가해보세요!
                </p>
              ) : (
                todos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    id={todo.id}
                    title={todo.title}
                    completed={todo.completed}
                    onToggle={handleToggleTodo}
                    onDelete={handleDeleteTodo}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
