import { Fragment } from "react";
import { HeroIcon } from "@neo4j-ndl/react";

interface Props {
    showSchemaView: boolean;
}

interface ResourceLinksBlockProps {
    listBlockTitle: string;
    links: Links[];
}

interface Links {
    href: string;
    iconName: string;
    label: string;
}

const linksResources: Links[] = [
    {
        href: "https://neo4j.com/docs/graphql-manual/current/",
        iconName: "DocumentTextIcon",
        label: "Documentation",
    },
    {
        href: "https://neo4j.com/graphacademy/training-graphql-apis/enrollment/",
        iconName: "AcademicCapIcon",
        label: "Neo4j Graph Academy",
    },
    {
        href: "https://discord.com/channels/787399249741479977/818578492723036210",
        iconName: "ChatAlt2Icon",
        label: "Community",
    },
];

const linksGithub: Links[] = [
    {
        href: "https://github.com/neo4j/graphql",
        iconName: "DocumentTextIcon",
        label: "Github repository",
    },
    {
        href: "https://github.com/neo4j/graphql/issues",
        iconName: "SpeakerphoneIcon",
        label: "Issue tracker",
    },
];

const linksDocumentation: Links[] = [
    {
        href: "https://neo4j.com/docs/graphql-manual/current/type-definitions/",
        iconName: "DocumentTextIcon",
        label: "Type definitions",
    },
    {
        href: "https://neo4j.com/docs/graphql-manual/current/queries/",
        iconName: "VariableIcon",
        label: "Example queries",
    },
    {
        href: "https://neo4j.com/docs/graphql-manual/current/directives/",
        iconName: "AtSymbolIcon",
        label: "Directives",
    },
    {
        href: "https://neo4j.com/docs/graphql-manual/current/filtering/",
        iconName: "FilterIcon",
        label: "Filtering",
    },
];

const ResourceLinksBlock = ({ listBlockTitle, links }: ResourceLinksBlockProps): JSX.Element => {
    return (
        <Fragment>
            <div className="flex items-center">
                <span className="h6">{listBlockTitle}</span>
                <HeroIcon className="h-4 w-4 ml-1 rotate-45" type="outline" iconName="ArrowSmUpIcon" />
            </div>
            <ul className="mb-6">
                {links.map((link) => {
                    return (
                        <li key={link.href} className="mt-6 cursor-pointer">
                            <a className="flex justify-start items-center" href={link.href} target="_blank">
                                {/* @ts-ignore - iconName is a string */}
                                <HeroIcon className="h-6 w-6 mr-2 stroke-1" type="outline" iconName={link.iconName} />
                                <p className="p-0 m-0">{link.label}</p>
                            </a>
                        </li>
                    );
                })}
            </ul>
        </Fragment>
    );
};

export const Resources = ({ showSchemaView }: Props): JSX.Element => {
    const linksForResources = showSchemaView ? linksResources.slice(1) : linksResources;

    return (
        <div data-test-help-drawer-resources-list>
            {showSchemaView ? (
                <Fragment>
                    <ResourceLinksBlock listBlockTitle="Documentation" links={linksDocumentation} />
                    <hr className="mb-6" />
                </Fragment>
            ) : null}
            <ResourceLinksBlock listBlockTitle="Github" links={linksGithub} />
            <hr className="mb-6" />
            <ResourceLinksBlock listBlockTitle="Resources" links={linksForResources} />
        </div>
    );
};
