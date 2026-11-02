import { ExperimentOutlined, LineChartOutlined } from '@ant-design/icons'
import { Alert, Card, Col, Empty, Row, Segmented, Space, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { EChartsOption } from 'echarts'
import { useEffect, useMemo, useState } from 'react'
import Chart from '@/components/Chart'
import { useUserStore } from '@/stores/userStore'
import type { EvaluationMetric } from '@/types/result'

/** 仅用于演示图表组件的示例数据，不代表任何实验结果 */
const DEMO_LINE: EChartsOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['美学评分', '评分 + 偏好比较'], bottom: 0 },
  grid: { left: 40, right: 16, top: 24, bottom: 46 },
  xAxis: { type: 'category', data: ['epoch 1', 'epoch 2', 'epoch 3', 'epoch 4'] },
  yAxis: { type: 'value', max: 1, name: 'SRCC' },
  series: [
    {
      name: '美学评分',
      type: 'line',
      smooth: true,
      data: [0.42, 0.47, 0.49, 0.51],
      itemStyle: { color: '#94a3b8' }
    },
    {
      name: '评分 + 偏好比较',
      type: 'line',
      smooth: true,
      data: [0.45, 0.52, 0.56, 0.58],
      itemStyle: { color: '#2563eb' }
    }
  ]
}

const DEMO_BAR: EChartsOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['单一评分', '融合方案'], bottom: 0 },
  grid: { left: 40, right: 16, top: 24, bottom: 46 },
  xAxis: { type: 'category', data: ['质量筛查', '美学评分', '偏好比较'] },
  yAxis: { type: 'value', max: 1 },
  series: [
    {
      name: '单一评分',
      type: 'bar',
      data: [0.61, 0.55, 0.5],
      itemStyle: { color: '#cbd5e1' }
    },
    {
      name: '融合方案',
      type: 'bar',
      data: [0.72, 0.58, 0.64],
      itemStyle: { color: '#2563eb' }
    }
  ]
}

export default function Evaluation() {
  const { evaluation, loading, error, loadEvaluation } = useUserStore()
  const [mode, setMode] = useState<'measured' | 'demo'>('measured')

  useEffect(() => {
    void loadEvaluation()
  }, [loadEvaluation])

  const columns: ColumnsType<EvaluationMetric> = [
    { title: '算法模块', dataIndex: 'module', width: 150 },
    { title: '评价指标', dataIndex: 'metric', width: 210 },
    {
      title: '当前结果',
      dataIndex: 'value',
      width: 120,
      render: (value: string, record) =>
        record.status === 'measured' ? (
          <b>{value}</b>
        ) : (
          <Tag color="default">待实测</Tag>
        )
    },
    { title: '说明', dataIndex: 'note' }
  ]

  const measuredEmpty = useMemo(
    () => !evaluation?.measured || evaluation.metrics.every((m) => m.status === 'pending'),
    [evaluation]
  )

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">模型评估</h1>
        <p className="page-sub">
          用于展示各算法模块的实验指标（数据来自 GET /api/evaluation）
        </p>
      </div>

      <Alert
        style={{ marginBottom: 16 }}
        type={measuredEmpty ? 'warning' : 'success'}
        showIcon
        message={
          measuredEmpty
            ? '暂无实测数据：不展示未经测量的性能结论'
            : `数据更新时间：${evaluation?.updated_at}`
        }
        description={
          measuredEmpty
            ? '页面仅展示指标定义与当前进度。算法模块完成实验后，后端返回真实指标，前端自动替换为实测结果；下方的「组件演示」仅为图表能力展示，采用虚构数据并已标注。'
            : '以下指标来自后端返回的真实实验结果。'
        }
      />

      <Card
        title="评价指标"
        style={{ marginBottom: 16 }}
        extra={<span className="muted" style={{ fontSize: 12 }}>更新于 {evaluation?.updated_at ?? '—'}</span>}
      >
        <Table
          rowKey={(record) => `${record.module}-${record.metric}`}
          loading={loading}
          dataSource={evaluation?.metrics ?? []}
          columns={columns}
          pagination={false}
          locale={{ emptyText: <Empty description={error ?? '暂无指标数据'} /> }}
        />
      </Card>

      <Card
        title={
          <Space>
            <LineChartOutlined />
            <span>结果可视化</span>
          </Space>
        }
        extra={
          <Segmented
            size="small"
            value={mode}
            onChange={(value) => setMode(value as 'measured' | 'demo')}
            options={[
              { label: '实测数据', value: 'measured' },
              { label: '组件演示（示例数据）', value: 'demo' }
            ]}
          />
        }
      >
        {mode === 'measured' ? (
          <Empty
            description={
              measuredEmpty
                ? '尚无实验数据，接入真实实验结果后在此展示折线图与柱状图'
                : '实测数据可视化待接入'
            }
            style={{ padding: '40px 0' }}
          />
        ) : (
          <>
            <Alert
              type="info"
              showIcon
              icon={<ExperimentOutlined />}
              message="以下图表为组件演示用的示例数据，不代表本系统的实验结果"
              style={{ marginBottom: 12 }}
            />
            <Row gutter={16}>
              <Col xs={24} lg={12}>
                <div style={{ fontSize: 12.5, marginBottom: 6 }}>
                  排序相关性随训练阶段变化（折线图）
                </div>
                <Chart option={DEMO_LINE} />
              </Col>
              <Col xs={24} lg={12}>
                <div style={{ fontSize: 12.5, marginBottom: 6 }}>
                  各模块方案对比（柱状图）
                </div>
                <Chart option={DEMO_BAR} />
              </Col>
            </Row>
          </>
        )}
      </Card>
    </div>
  )
}
