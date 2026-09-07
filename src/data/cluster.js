// 04:12. The job died.
//
// The other minigames are about rooms with people in them. This one is about the part of the work
// nobody puts in a talk: a wall of output, a reservation that is running out, and one line in it
// that is the actual problem. The mechanic is visual search under a clock, and the lesson is the
// oldest one in the field — the error is never the last line, and the last line is always the one
// you read first.
//
// Every stage is a real failure mode, written the way logs actually look at four in the morning.

export const CLUSTER_ENERGY = 8;        // it is four in the morning
export const CLUSTER_SECONDS = 40;      // what is left on the reservation
export const CLUSTER_PENALTY = 5;       // seconds burned on a wrong line

export const clusterStages = [
  {
    id: 'path',
    title: 'exited with status 1',
    hint: 'It ran for eleven hours and then it did not. The last line is a warning you have read four hundred times.',
    lines: [
      { t: '[04:11:58] W tensorflow/stream_executor: could not open CUDA library libcudnn.so.8', why: 'This warning has been in every log you have ever produced. It has never once been the problem.' },
      { t: '[04:11:58] I Training step 41200/60000  loss=0.4471  lr=1.2e-4  4.1 it/s', why: 'The job was fine here. It was fine for eleven hours.' },
      { t: '[04:11:59] I Saving checkpoint to /scratch/$USER/runs/ab7/ckpt-41200 ...', real: true, why: '$USER is not set on the compute nodes — only on the login node, where you tested it. It has been writing checkpoints to a directory literally named "$USER" for eleven hours, and /scratch just filled up.' },
      { t: '[04:12:01] W NCCL WARN Bootstrap : no socket interface found, retrying', why: 'Alarming, routine, and self-resolving. It retried and it worked.' },
      { t: '[04:12:03] E RuntimeError: unable to write checkpoint (No space left on device)', why: 'This is the symptom, and it is the line you read first, and it is two lines below the cause.' },
      { t: '[04:12:03] I Traceback (most recent call last): File "train.py", line 812, in <module>', why: 'The traceback points at the line that raised, which is almost never the line that was wrong.' },
      { t: 'slurmstepd: error: *** JOB 8814402 ON gpu-0417 CANCELLED AT 2031-03-14T04:12:04 ***', why: 'The scheduler noticed the process died. That is all this line means.' },
    ],
  },
  {
    id: 'oom',
    title: 'CUDA out of memory (again)',
    hint: 'Same script, same node, same batch size as yesterday, when it fit.',
    lines: [
      { t: '[02:40:12] I Loading config from configs/base.yaml (overrides: configs/local.yaml)', real: true, why: 'configs/local.yaml is gitignored, so it is not on the node, so the override silently did not happen and the batch size fell back to the value in base.yaml — which is four times bigger.' },
      { t: '[02:40:14] I world_size=4  rank=0  device=cuda:0  batch_size=256', why: 'This is the number that is wrong, printed correctly. Reading it as the cause stops you from asking where it came from.' },
      { t: '[02:40:19] W Detected call of `lr_scheduler.step()` before `optimizer.step()`', why: 'A real warning about a real thing that is not this thing.' },
      { t: '[02:41:02] E torch.cuda.OutOfMemoryError: Tried to allocate 3.91 GiB (GPU 0; 39.59 GiB total)', why: 'The exception. It tells you the allocation failed and nothing whatsoever about why the allocation was that size.' },
      { t: '[02:41:02] I Tried to allocate 3.91 GiB. Of which 2.14 GiB is free. PyTorch reserved 34.2 GiB.', why: 'The fragmentation report, which is where you will spend forty minutes if you start here.' },
      { t: '[02:41:03] I Setting PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True may help', why: 'It will not help. It has never helped. You will try it.' },
    ],
  },
  {
    id: 'nan',
    title: 'loss = nan',
    hint: 'It trained cleanly for four thousand steps and then stopped meaning anything.',
    lines: [
      { t: '[19:04:41] I step 3990  loss=2.1140  grad_norm=0.87  lr=3.0e-4', why: 'Healthy. Everything here is healthy.' },
      { t: '[19:04:44] I step 4000  loss=2.1102  grad_norm=inf  lr=3.0e-4', real: true, why: 'grad_norm went to inf one step before the loss went to nan. The gradient blew up first; the loss is downstream. Everything after this line is a description of a corpse.' },
      { t: '[19:04:47] I step 4010  loss=nan  grad_norm=nan  lr=3.0e-4', why: 'This is where you noticed. It is ten steps after it happened.' },
      { t: '[19:04:47] W Gradient overflow. Skipping step, reducing loss scale to 32768.0', why: 'The mixed-precision scaler doing exactly what it is supposed to do, loudly, as it always does.' },
      { t: '[19:05:12] I step 4100  loss=nan  grad_norm=nan  lr=3.0e-4', why: 'Still nan. It will be nan for the remaining nine hours of the reservation.' },
      { t: '[19:05:12] W NaN or Inf found in input tensor.', why: 'A downstream check firing downstream. True, useless.' },
      { t: '[19:14:03] I Saving checkpoint to /scratch/runs/ab9/ckpt-4200 ...', why: 'It is faithfully checkpointing the nan. It will do this every ten minutes until the reservation ends.' },
    ],
  },
  {
    id: 'silent',
    title: 'exit code 0, and nothing in the output directory',
    hint: 'The worst kind. It says it worked.',
    lines: [
      { t: '[23:58:00] I Run complete. 60000/60000 steps. Final loss 0.3312.', why: 'It did run. That is what makes this one take three days.' },
      { t: '[23:58:00] I Writing results to results/ab11/metrics.json', real: true, why: 'A relative path. The scheduler starts the job in a working directory that is not the one you submitted from, so results/ab11 was created somewhere in the scheduler spool and deleted with the job. Eleven hours of compute, exit code 0, and nothing anywhere.' },
      { t: '[23:58:00] I Total wall time: 11:47:22. Peak memory 31.4 GiB.', why: 'A summary of work that is now gone.' },
      { t: '[23:58:01] I Wrote 0 rows to stdout', why: 'Suspicious, and not the cause. You will notice it second.' },
      { t: '[23:58:01] I Cleaning up temporary directory /tmp/tmpq8j3lk2p', why: 'Routine. Cleaning up a directory that is not the one you care about.' },
      { t: 'slurmstepd: done with job', why: 'The scheduler is satisfied. The scheduler is always satisfied.' },
    ],
  },
];

export const clusterNote = 'The reservation has forty seconds left on it. Find the line that is actually the problem — not the one that raised, and not the last one.';

export const clusterGrades = {
  great: 'Four for four, at four in the morning, on someone else\'s log format. This is a skill nobody teaches and everybody grades you on.',
  good: 'You found most of them. The one you missed cost you a resubmission and about ninety minutes, which is the going rate.',
  ok: 'Some of it. You will find the rest tomorrow, in the shower, immediately.',
  rough: 'The reservation ended before you did. It requeues at position 41 in the queue, which is nine hours, which is Thursday.',
};

export const clusterMiss = [
  'Not that one. Twelve seconds of your reservation, gone, to a line you have read four hundred times.',
  'That is the symptom. You know it is the symptom. You clicked it anyway, because it is red.',
  'No. That line has never been the problem in the history of this cluster.',
  'That is the traceback. The traceback points at the thing that raised, which is not the thing that was wrong.',
];
