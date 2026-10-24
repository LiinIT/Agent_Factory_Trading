'use client';

import { Upload } from 'lucide-react';
import { useState } from 'react';

import { api } from '@/lib/api';
import type { Project, PushResult } from '@/lib/types';

import { ProjectDeleteForm } from './project-delete-form';
import { ProjectFieldForm } from './project-field-form';

/**
 * Cài đặt nơi lưu + git của một project: chuyển thư mục, gắn remote, push tay (chỉ Chỉ huy
 * trưởng bấm; máy quét key trước khi push), xoá project.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function ProjectSettings({ project }: { project: Project }) {
  const [pushResult, setPushResult] = useState<PushResult | null>(null);
  const [isPushing, setIsPushing] = useState(false);
  const push = async () => {
    if (!window.confirm(`Push project "${project.name}" lên ${project.gitRemote}?`)) return;
    setIsPushing(true);
    try {
      setPushResult(await api.pushProject(project.id));
    } catch (caught) {
      setPushResult({ ok: false, output: caught instanceof Error ? caught.message : String(caught) });
    } finally {
      setIsPushing(false);
    }
  };
  return (
    <div className="project-settings">
      <p className="muted project-path" title={project.path}>Đang lưu tại: {project.path}</p>
      <ProjectFieldForm
        key={`dir-${project.dir ?? ''}`}
        label="Nơi lưu source"
        initialValue={project.dir ?? ''}
        placeholder="~/Documents/StudioMia_workspace/ten-app"
        hint="Thư mục mới hoặc trống; để trống = nơi mặc định ~/Documents/StudioMia_workspace/workspace_apps_dv0."
        submitLabel="Chuyển"
        onSubmit={(dir) => api.moveProject(project.id, dir)}
      />
      <ProjectFieldForm
        key={`git-${project.gitRemote ?? ''}`}
        label="Git remote (origin)"
        initialValue={project.gitRemote ?? ''}
        placeholder="git@github.com:chu/repo.git"
        hint="Không ghi token vào URL — git dùng SSH key / đăng nhập sẵn có trên máy. Để trống = gỡ remote."
        submitLabel="Lưu"
        onSubmit={(url) => api.setProjectRemote(project.id, url)}
      />
      <button className="button button-primary" disabled={!project.gitRemote || isPushing} onClick={() => void push()}>
        <Upload size={13} aria-hidden /> {isPushing ? 'Đang quét key và push…' : 'Push'}
      </button>
      {pushResult ? <pre className={pushResult.ok ? 'project-push-ok' : 'error'}>{pushResult.output}</pre> : null}
      <ProjectDeleteForm project={project} />
    </div>
  );
}
