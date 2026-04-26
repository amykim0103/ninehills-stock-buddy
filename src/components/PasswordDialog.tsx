import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const PASSWORD = "9999";

export default function PasswordDialog({ open, onOpenChange, onSuccess }: Props) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (pw === PASSWORD) {
      setPw("");
      setError(false);
      onOpenChange(false);
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setPw("");
          setError(false);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-xs rounded-2xl">
        <DialogHeader>
          <DialogTitle>편집 비밀번호</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            type="password"
            inputMode="numeric"
            placeholder="••••"
            value={pw}
            onChange={(e) => {
              setPw(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus
            className="text-center text-lg tracking-[0.3em]"
          />
          {error && (
            <p className="text-xs text-destructive text-center">
              비밀번호가 올바르지 않습니다
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={submit}>확인</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
