import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddTodoForm } from "@/components/AddTodoForm";
import { TodoItem } from "@/components/TodoItem";
import { toast } from "@/hooks/use-toast";
import { User } from "lucide-react";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  userId: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    const userData = JSON.parse(currentUser);
    setUser(userData);

    const allTodos = JSON.parse(localStorage.getItem("todos") || "[]");
    const userTodos = allTodos.filter((todo: Todo) => todo.userId === userData.id);
    setTodos(userTodos);
  }, [navigate]);

  const handleAddTodo = (title: string) => {
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      completed: false,
      userId: user.id,
    };

    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);

    const allTodos = JSON.parse(localStorage.getItem("todos") || "[]");
    allTodos.push(newTodo);
    localStorage.setItem("todos", JSON.stringify(allTodos));

    toast({
      title: "할 일 추가됨",
      description: "새 할 일이 추가되었습니다.",
    });
  };

  const handleToggleTodo = (id: string) => {
    const updatedTodos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);

    const allTodos = JSON.parse(localStorage.getItem("todos") || "[]");
    const updatedAllTodos = allTodos.map((todo: Todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    localStorage.setItem("todos", JSON.stringify(updatedAllTodos));
  };

  const handleDeleteTodo = (id: string) => {
    const updatedTodos = todos.filter((todo) => todo.id !== id);
    setTodos(updatedTodos);

    const allTodos = JSON.parse(localStorage.getItem("todos") || "[]");
    const updatedAllTodos = allTodos.filter((todo: Todo) => todo.id !== id);
    localStorage.setItem("todos", JSON.stringify(updatedAllTodos));

    toast({
      title: "할 일 삭제됨",
      description: "할 일이 삭제되었습니다.",
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Todo App</h1>
          <Button variant="outline" onClick={() => navigate("/profile")}>
            <User className="mr-2 h-4 w-4" />
            {user.name}
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
