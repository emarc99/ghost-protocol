"use client";

import React from "react";

interface PanelHeaderProps {
  index: string;
  title: string;
  tag?: string;
  tagType?: "default" | "alert" | "warning" | "success";
}

export function PanelHeader({ index, title, tag, tagType = "default" }: PanelHeaderProps) {
  return (
    <div className="panel-header">
      <span className="panel-index">[{index}]</span>
      <h2>{title}</h2>
      {tag && <span className={`panel-tag ${tagType}`}>{tag}</span>}
    </div>
  );
}
