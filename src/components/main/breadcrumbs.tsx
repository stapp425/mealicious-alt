"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter((s) => s);

  return (
    <Breadcrumb className={cn(
      pathSegments.length === 0 && "hidden",
      "hidden md:block"
    )}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator/>
        {
          pathSegments.map((segment, index) => (
            <Slot key={index}>
              {
                index !== pathSegments.length - 1 ? (
                  <>
                  <BreadcrumbItem>
                    <BreadcrumbLink href={`/${pathSegments.slice(0, index + 1).join("/")}`}>
                      {segment.charAt(0).toUpperCase() + segment.slice(1)}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator/>
                  </>
                ) : (
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {segment.charAt(0).toUpperCase() + segment.slice(1)}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                )
              }
            </Slot>
          ))
        }
      </BreadcrumbList>
    </Breadcrumb>
  );
}