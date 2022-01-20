import React from "react";
import { t } from "ttag";
import PropTypes from "prop-types";
import {
  isVirtualCardId,
  getQuestionIdFromVirtualTableId,
} from "metabase/lib/saved-questions";
import * as Urls from "metabase/lib/urls";
import Questions from "metabase/entities/questions";
import TableInfoPopover from "metabase/components/MetadataInfo/TableInfoPopover";

import {
  TablesDivider,
  Container,
  SourceBadge,
} from "./QuestionDataSource.styled";

QuestionSidebarDataSource.propTypes = {
  question: PropTypes.object,
  originalQuestion: PropTypes.object,
  subHead: PropTypes.bool,
  isObjectDetail: PropTypes.bool,
};

function isMaybeBasedOnDataset(question) {
  const tableId = question.query().sourceTableId();
  return isVirtualCardId(tableId);
}

function QuestionSidebarDataSource({
  question,
  originalQuestion,
  subHead,
  ...props
}) {
  if (!question) {
    return null;
  }

  const variant = subHead ? "subhead" : "head";

  if (!question.isStructured() || !isMaybeBasedOnDataset(question)) {
    return (
      <DataSourceCrumbs question={question} variant={variant} {...props} />
    );
  }

  const sourceTable = question.query().sourceTableId();
  const sourceQuestionId = getQuestionIdFromVirtualTableId(sourceTable);

  if (originalQuestion?.id() === sourceQuestionId) {
    return (
      <SourceDatasetBreadcrumbs
        dataset={originalQuestion.card()}
        variant={variant}
        {...props}
      />
    );
  }

  return (
    <Questions.Loader id={sourceQuestionId} loadingAndErrorWrapper={false}>
      {({ question: sourceQuestion }) => {
        if (!sourceQuestion) {
          return null;
        }
        if (sourceQuestion.dataset) {
          return (
            <SourceDatasetBreadcrumbs
              dataset={sourceQuestion}
              variant={variant}
              {...props}
            />
          );
        }
        return (
          <DataSourceCrumbs question={question} variant={variant} {...props} />
        );
      }}
    </Questions.Loader>
  );
}

DataSourceCrumbs.propTypes = {
  question: PropTypes.object,
  variant: PropTypes.oneOf(["head", "subhead"]),
  isObjectDetail: PropTypes.bool,
};

function DataSourceCrumbs({ question, variant, isObjectDetail, ...props }) {
  const parts = getDataSourceParts({
    question,
    subHead: variant === "subhead",
    isObjectDetail,
  });
  return <DataSource parts={parts} variant={variant} {...props} />;
}

SourceDatasetBreadcrumbs.propTypes = {
  dataset: PropTypes.object.isRequired,
};

function SourceDatasetBreadcrumbs({ dataset, ...props }) {
  const { collection } = dataset;
  return (
    <DataSource
      {...props}
      parts={[
        <SourceBadge
          key="dataset-collection"
          to={Urls.collection(collection)}
          icon="dataset"
          inactiveColor="text-light"
        >
          {collection?.name || t`Our analytics`}
        </SourceBadge>,
        <SourceBadge
          key="dataset-name"
          to={Urls.question(dataset)}
          inactiveColor="text-light"
        >
          {dataset.name}
        </SourceBadge>,
      ]}
    />
  );
}

QuestionSidebarDataSource.shouldRender = ({ question, isObjectDetail }) =>
  getDataSourceParts({ question, isObjectDetail }).length > 0;

function getDataSourceParts({ question, subHead, isObjectDetail }) {
  if (!question) {
    return [];
  }

  const parts = [];

  const isStructuredQuery = question.isStructured();
  const query = isStructuredQuery
    ? question.query().rootQuery()
    : question.query();

  const database = query.database();
  if (database) {
    parts.push({
      icon: "database",
      name: database.displayName(),
      href: database.id >= 0 && Urls.browseDatabase(database),
    });
  }

  const table = query.table();
  if (table && table.hasSchema()) {
    const isBasedOnSavedQuestion = isVirtualCardId(table.id);
    if (!isBasedOnSavedQuestion) {
      parts.push({
        name: table.schema_name,
        href: database.id >= 0 && Urls.browseSchema(table),
      });
    }
  }

  if (table) {
    const hasTableLink = subHead || isObjectDetail;
    if (!isStructuredQuery) {
      return {
        icon: "table",
        name: table.displayName(),
        link: hasTableLink ? getTableURL() : "",
      };
    }

    const allTables = [
      table,
      ...query.joins().map(j => j.joinedTable()),
    ].filter(Boolean);

    parts.push(
      <QuestionTableBadges
        tables={allTables}
        subHead={subHead}
        hasLink={hasTableLink}
      />,
    );
  }

  if (isObjectDetail) {
    parts.push({
      name: question.objectDetailPK(),
    });
  }

  return parts.filter(
    part => React.isValidElement(part) || part.name || part.icon,
  );
}

const crumbShape = PropTypes.shape({
  name: PropTypes.string.isRequired,
  icon: PropTypes.string,
  href: PropTypes.string,
});

const partPropType = PropTypes.oneOfType([crumbShape, PropTypes.node]);

DataSource.propTypes = {
  variant: PropTypes.oneOf(["head", "subhead"]),
  parts: PropTypes.arrayOf(partPropType).isRequired,
};

export function DataSource({ variant = "head", parts, ...props }) {
  return (
    <Container {...props} variant={variant}>
      {parts.map((part, index) => {
        return (
          <React.Fragment key={index}>
            {React.isValidElement(part) ? (
              part
            ) : (
              <SourceBadge to={part.href} icon={part.icon}>
                {part.name}
              </SourceBadge>
            )}
          </React.Fragment>
        );
      })}
    </Container>
  );
}

QuestionTableBadges.propTypes = {
  tables: PropTypes.arrayOf(PropTypes.object).isRequired,
};

function QuestionTableBadges({ tables }) {
  const parts = tables.map(table => (
    <SourceBadge key={table.id} to={getTableURL(table)} icon="table">
      <TableInfoPopover table={table} placement="bottom-start">
        <span className="text-medium">{table.displayName()}</span>
      </TableInfoPopover>
    </SourceBadge>
  ));

  return (
    <DataSource
      parts={parts}
      divider={<TablesDivider>+</TablesDivider>}
      data-testid="question-table-badges"
    />
  );
}

function getTableURL(table) {
  if (isVirtualCardId(table.id)) {
    const cardId = getQuestionIdFromVirtualTableId(table.id);
    return Urls.question({ id: cardId, name: table.displayName() });
  }
  return table.newQuestion().getUrl();
}

export default QuestionSidebarDataSource;