import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import { dtoList } from "@/lib/serialize";
import CustomSkill from "@/models/CustomSkill";
import { PageHeader } from "@/components/dashboard/page-header";
import { SkillsClient } from "@/components/dashboard/skills-client";
import type { SkillDTO } from "@/lib/types";
import { SKILLS } from "@/lib/agent/registry";

export default async function SkillsPage() {
  const session = await auth();
  await connectDB();
  const custom = dtoList<{
    id: string; name: string; description: string; instruction: string;
    risk: string; tools: string[]; version: string;
    tests: Array<{ name: string; instruction: string; expected: string; passed: boolean }>;
  }>(
    await CustomSkill.find({
      workspaceId: session?.user?.workspaceId,
      ownerId: session?.user?.id,
    }).lean()
  );

  const catalog: SkillDTO[] = SKILLS.map((skill) => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    tools: [],
    risk: skill.steps[0]?.risk ?? "read",
    icon: skill.icon,
    example: skill.example,
    version: skill.version,
    installed: true,
    autonomyFloor: skill.autonomyFloor,
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Skills"
        description="Specialists with narrow tool access. Browse the catalog, test a skill or build your own."
      />
      <SkillsClient catalog={catalog} custom={custom} />
    </div>
  );
}
